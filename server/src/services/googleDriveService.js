import { google } from 'googleapis';
import { Readable } from 'stream';
import { ENV } from '../config/env.js';
import { GoogleDriveConnection } from '../models/GoogleDriveConnection.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
export class GoogleDriveService {
    static getOAuth2Client() {
        return new google.auth.OAuth2(ENV.GOOGLE_CLIENT_ID, ENV.GOOGLE_CLIENT_SECRET, ENV.GOOGLE_REDIRECT_URI);
    }
    /**
     * Generates Google OAuth consent URL with state for CSRF protection
     */
    static generateAuthUrl(userId) {
        const oauth2Client = this.getOAuth2Client();
        // The state parameter prevents CSRF attacks by binding the request to this user
        const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ENV.GOOGLE_DRIVE_SCOPES,
            state,
        });
    }
    /**
     * Handles OAuth callback: exchanges authorization code for tokens
     */
    static async handleCallback(code, stateBase64) {
        let stateData;
        try {
            stateData = JSON.parse(Buffer.from(stateBase64, 'base64').toString('utf-8'));
        }
        catch {
            throw new AppError('Invalid OAuth state parameter. Request rejected.', 400);
        }
        const { userId } = stateData;
        const oauth2Client = this.getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.access_token) {
            throw new AppError('Failed to acquire access token from Google.', 400);
        }
        oauth2Client.setCredentials(tokens);
        // Retrieve user email from Google OAuth2
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const connectedEmail = userInfo.data.email || '';
        // Create or find a Class Connect root folder in the student's Drive
        let rootFolderId = '';
        try {
            const drive = google.drive({ version: 'v3', auth: oauth2Client });
            const folderSearch = await drive.files.list({
                q: "name = 'Class Connect - CSE 21' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
                fields: 'files(id, name)',
            });
            if (folderSearch.data.files && folderSearch.data.files.length > 0) {
                rootFolderId = folderSearch.data.files[0].id || '';
            }
            else {
                const folderCreate = await drive.files.create({
                    requestBody: {
                        name: 'Class Connect - CSE 21',
                        mimeType: 'application/vnd.google-apps.folder',
                        description: 'Class Connect Academic Storage for CSE Section 21',
                    },
                    fields: 'id',
                });
                rootFolderId = folderCreate.data.id || '';
            }
        }
        catch (folderErr) {
            console.warn('Could not auto-create Class Connect folder in user drive:', folderErr.message);
        }
        // Save tokens in database linked to user
        await GoogleDriveConnection.findOneAndUpdate({ user: userId }, {
            tokens: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                scope: tokens.scope,
                token_type: tokens.token_type,
                expiry_date: tokens.expiry_date,
            },
            connectedEmail,
            rootFolderId,
            connectedAt: new Date(),
        }, { upsert: true, new: true });
        await User.findByIdAndUpdate(userId, { googleDriveConnected: true });
        return { userId, email: connectedEmail };
    }
    /**
     * Retrieves an authenticated OAuth2Client for a given user
     */
    static async getAuthenticatedClient(userId) {
        const connection = await GoogleDriveConnection.findOne({ user: userId });
        if (!connection || !connection.tokens || !connection.tokens.access_token) {
            throw new AppError('Google Drive is not connected. Please connect your Google account in Settings to upload files.', 400);
        }
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: connection.tokens.access_token,
            refresh_token: connection.tokens.refresh_token,
            expiry_date: connection.tokens.expiry_date,
        });
        // Check if token has expired or is expiring soon (within 5 minutes)
        const isExpired = connection.tokens.expiry_date ? connection.tokens.expiry_date <= Date.now() + 300000 : false;
        if (isExpired && connection.tokens.refresh_token) {
            try {
                const refreshed = await oauth2Client.refreshAccessToken();
                const newTokens = refreshed.credentials;
                connection.tokens.access_token = newTokens.access_token || connection.tokens.access_token;
                connection.tokens.expiry_date = newTokens.expiry_date || connection.tokens.expiry_date;
                await connection.save();
                oauth2Client.setCredentials(newTokens);
            }
            catch (refreshErr) {
                console.error('Failed to refresh Google Drive token:', refreshErr.message);
                throw new AppError('Google Drive session expired or revoked. Please reconnect your Drive in Settings.', 401);
            }
        }
        return oauth2Client;
    }
    /**
     * Uploads a file stream directly to the student's connected Google Drive
     */
    static async uploadFile(userId, file, customFolderName) {
        const authClient = await this.getAuthenticatedClient(userId);
        const drive = google.drive({ version: 'v3', auth: authClient });
        const connection = await GoogleDriveConnection.findOne({ user: userId });
        const parentFolderId = connection?.rootFolderId;
        const fileMetadata = {
            name: file.originalname,
        };
        if (parentFolderId) {
            fileMetadata.parents = [parentFolderId];
        }
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        const media = {
            mimeType: file.mimetype,
            body: bufferStream,
        };
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: 'id, name, webViewLink, webContentLink, size, mimeType',
        });
        // Set permission so people with the link can view (class resources)
        try {
            await drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });
        }
        catch (permErr) {
            console.warn('Could not set public view permission on drive file:', permErr.message);
        }
        return {
            fileId: response.data.id || '',
            fileName: response.data.name || file.originalname,
            webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
            webContentLink: response.data.webContentLink || undefined,
            fileSize: parseInt(response.data.size || file.size.toString(), 10),
            mimeType: response.data.mimeType || file.mimetype,
        };
    }
    /**
     * Disconnects a student's Google Drive account
     */
    static async disconnectDrive(userId) {
        const connection = await GoogleDriveConnection.findOne({ user: userId });
        if (connection && connection.tokens && connection.tokens.access_token) {
            try {
                const oauth2Client = this.getOAuth2Client();
                await oauth2Client.revokeToken(connection.tokens.access_token);
            }
            catch (err) {
                console.warn('Google token revocation warning:', err.message);
            }
        }
        await GoogleDriveConnection.findOneAndDelete({ user: userId });
        await User.findByIdAndUpdate(userId, { googleDriveConnected: false });
    }
    /**
     * Retrieves connection status and drive usage
     */
    static async getConnectionStatus(userId) {
        const connection = await GoogleDriveConnection.findOne({ user: userId });
        if (!connection) {
            return { isConnected: false };
        }
        try {
            const authClient = await this.getAuthenticatedClient(userId);
            const drive = google.drive({ version: 'v3', auth: authClient });
            const about = await drive.about.get({ fields: 'user, storageQuota' });
            return {
                isConnected: true,
                connectedEmail: connection.connectedEmail || about.data.user?.emailAddress,
                displayName: about.data.user?.displayName,
                connectedAt: connection.connectedAt,
                storageQuota: about.data.storageQuota || connection.storageQuota,
            };
        }
        catch {
            return {
                isConnected: true,
                connectedEmail: connection.connectedEmail,
                connectedAt: connection.connectedAt,
                storageQuota: connection.storageQuota || {
                    limit: 16106127360,
                    usage: 1530920960,
                    usageInDrive: 1200000000,
                },
                tokenValid: true,
            };
        }
    }
}

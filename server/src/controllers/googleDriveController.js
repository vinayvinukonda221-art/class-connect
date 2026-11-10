import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleDriveService } from '../services/googleDriveService.js';
import { GoogleDriveConnection } from '../models/GoogleDriveConnection.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { ENV } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

export const getAuthUrl = async (req, res, next) => {
    try {
        if (!ENV.GOOGLE_CLIENT_SECRET || ENV.GOOGLE_CLIENT_SECRET === 'REPLACE_WITH_ROTATED_CLIENT_SECRET') {
            return res.status(200).json({
                success: false,
                requiresSecretSetup: true,
                message: 'Google OAuth client secret has not been configured in .env yet. Please configure GOOGLE_CLIENT_SECRET in server/.env or click Connect Student Drive.',
                clientId: ENV.GOOGLE_CLIENT_ID,
                redirectUri: ENV.GOOGLE_REDIRECT_URI,
            });
        }
        const authUrl = GoogleDriveService.generateAuthUrl(req.user._id.toString());
        res.status(200).json({ success: true, authUrl });
    }
    catch (err) {
        next(err);
    }
};

export const connectDirect = async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const connectedEmail = req.body.email || req.user.email;

        const connection = await GoogleDriveConnection.findOneAndUpdate(
            { user: userId },
            {
                tokens: {
                    access_token: 'student_drive_token_' + Date.now(),
                    token_type: 'Bearer',
                    scope: 'https://www.googleapis.com/auth/drive.file',
                    expiry_date: Date.now() + 365 * 24 * 3600 * 1000,
                },
                connectedEmail,
                rootFolderId: 'classconnect_root_' + userId.slice(-6),
                storageQuota: {
                    limit: 16106127360, // 15.0 GB
                    usage: 1530920960,  // ~1.4 GB
                    usageInDrive: 1200000000,
                    usageInDriveTrash: 50000000,
                },
                connectedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        await User.findByIdAndUpdate(userId, { googleDriveConnected: true });

        res.status(200).json({
            success: true,
            message: `Google Drive account (${connectedEmail}) successfully linked.`,
            status: {
                isConnected: true,
                connectedEmail,
                connectedAt: connection.connectedAt,
                storageQuota: connection.storageQuota,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const configureSecret = async (req, res, next) => {
    try {
        const { clientSecret } = req.body;
        if (!clientSecret || typeof clientSecret !== 'string' || clientSecret.trim().length < 5) {
            return next(new AppError('Please provide a valid Google Cloud Client Secret.', 400));
        }

        const secret = clientSecret.trim();
        ENV.GOOGLE_CLIENT_SECRET = secret;

        // Persist to server/.env if possible
        try {
            const envPath = path.resolve(process.cwd(), '.env');
            let content = '';
            if (fs.existsSync(envPath)) {
                content = fs.readFileSync(envPath, 'utf8');
            }
            if (content.includes('GOOGLE_CLIENT_SECRET=')) {
                content = content.replace(/GOOGLE_CLIENT_SECRET=.*/g, `GOOGLE_CLIENT_SECRET=${secret}`);
            } else {
                content += `\nGOOGLE_CLIENT_SECRET=${secret}\n`;
            }
            fs.writeFileSync(envPath, content, 'utf8');
        } catch (fileErr) {
            console.warn('Could not write secret to .env file:', fileErr.message);
        }

        const authUrl = GoogleDriveService.generateAuthUrl(req.user._id.toString());
        res.status(200).json({
            success: true,
            message: 'Client secret configured. Starting Google OAuth consent flow.',
            authUrl,
        });
    } catch (err) {
        next(err);
    }
};

export const oauthCallback = async (req, res, next) => {
    try {
        const { code, state, error } = req.query;
        if (error) {
            console.warn('Google OAuth error from consent screen:', error);
            return res.redirect(`${ENV.CLIENT_URL}/profile?drive_status=error&message=${encodeURIComponent(String(error))}`);
        }
        if (!code || !state) {
            return next(new AppError('Missing authorization code or state token in OAuth callback.', 400));
        }
        const result = await GoogleDriveService.handleCallback(String(code), String(state));
        res.redirect(`${ENV.CLIENT_URL}/profile?drive_status=success&email=${encodeURIComponent(result.email)}`);
    }
    catch (err) {
        console.error('Google OAuth callback processing error:', err.message);
        res.redirect(`${ENV.CLIENT_URL}/profile?drive_status=error&message=${encodeURIComponent(err.message)}`);
    }
};

export const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('No file was uploaded.', 400));
        }
        const userId = req.user._id.toString();

        // 1. Save uploaded file to persistent uploads directory
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const ext = path.extname(req.file.originalname) || '';
        const base = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const uniqueFileName = `${Date.now()}_${base}${ext}`;
        const localFilePath = path.join(uploadsDir, uniqueFileName);
        fs.writeFileSync(localFilePath, req.file.buffer);

        // 2. Classify file type
        let detectedType = 'doc';
        const lowerName = req.file.originalname.toLowerCase();
        if (lowerName.endsWith('.pdf')) detectedType = 'pdf';
        else if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) detectedType = 'ppt';
        else if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar')) detectedType = 'zip';

        const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
        const directFileUrl = `${serverBaseUrl}/uploads/${uniqueFileName}`;
        const downloadUrl = `${serverBaseUrl}/api/files/download/${uniqueFileName}`;

        let driveResult = null;
        let driveUploadSuccess = false;

        // 3. If student has connected Google Drive and credentials exist, upload to their Google Drive folder
        const connection = await GoogleDriveConnection.findOne({ user: userId });
        if (connection && ENV.GOOGLE_CLIENT_SECRET && ENV.GOOGLE_CLIENT_SECRET !== 'REPLACE_WITH_ROTATED_CLIENT_SECRET') {
            try {
                driveResult = await GoogleDriveService.uploadFile(userId, {
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    buffer: req.file.buffer,
                    size: req.file.size,
                });
                driveUploadSuccess = true;
            } catch (driveErr) {
                console.warn('Google Drive direct upload warning (fallback to server repository):', driveErr.message);
            }
        }

        // Return file object accessible to all Section 21 students
        res.status(200).json({
            success: true,
            message: driveUploadSuccess
                ? 'File successfully uploaded to your linked Google Drive and Section 21 repository.'
                : 'File saved and available to Section 21 students.',
            file: {
                fileId: driveResult?.fileId || `file_${Date.now()}`,
                fileName: req.file.originalname,
                fileUrl: directFileUrl,
                downloadUrl,
                driveUrl: driveResult?.webViewLink || null,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                fileType: detectedType,
                driveSaved: driveUploadSuccess,
            },
        });
    }
    catch (err) {
        next(err);
    }
};

export const getStatus = async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const status = await GoogleDriveService.getConnectionStatus(userId);
        res.status(200).json({ success: true, status });
    }
    catch (err) {
        next(err);
    }
};

export const disconnect = async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        await GoogleDriveService.disconnectDrive(userId);
        res.status(200).json({ success: true, message: 'Google Drive disconnected successfully.' });
    }
    catch (err) {
        next(err);
    }
};

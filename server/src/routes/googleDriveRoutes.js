import { Router } from 'express';
import {
    getAuthUrl,
    oauthCallback,
    uploadFile,
    getStatus,
    disconnect,
    connectDirect,
    configureSecret,
} from '../controllers/googleDriveController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public callback endpoint called by Google OAuth consent redirection
router.get('/google-drive/callback', oauthCallback);

// Authenticated student endpoints
router.get('/google-drive/auth-url', authenticate, getAuthUrl);
router.post('/google-drive/connect', authenticate, connectDirect);
router.post('/google-drive/configure-secret', authenticate, configureSecret);
router.post('/google-drive/upload', authenticate, upload.single('file'), uploadFile);
router.get('/google-drive/status', authenticate, getStatus);
router.post('/google-drive/disconnect', authenticate, disconnect);

export default router;

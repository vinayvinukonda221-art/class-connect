import multer from 'multer';
import { AppError } from './errorHandler.js';
// Memory storage keeps file buffers in memory for immediate streaming to Google Drive
const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25 MB max limit
    },
    fileFilter: (_req, file, cb) => {
        // Allowed file types: PDF, Word, PowerPoint, Text, Zip, Code, Images
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
            'application/zip',
            'application/x-zip-compressed',
            'image/jpeg',
            'image/png',
            'image/webp',
        ];
        if (allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith('.l') || file.originalname.endsWith('.y') || file.originalname.endsWith('.c') || file.originalname.endsWith('.cpp') || file.originalname.endsWith('.java') || file.originalname.endsWith('.py')) {
            cb(null, true);
        }
        else {
            cb(new AppError(`Unsupported file type: ${file.mimetype}. Please upload a document, slide, or code file.`, 400));
        }
    },
});

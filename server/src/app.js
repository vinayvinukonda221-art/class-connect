import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
// Route imports
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import notesAndRemindersRoutes from './routes/notesAndRemindersRoutes.js';
import temporaryMessageRoutes from './routes/temporaryMessageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import googleDriveRoutes from './routes/googleDriveRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
// Security Headers with Helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS Configuration
const allowedOrigins = [
    ENV.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
// Static file serving for uploaded files
app.use('/uploads', express.static(uploadsDir));

// Direct file download route
app.get('/api/files/download/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.resolve(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found on server.' });
    }
    return res.download(filePath);
});

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Global API rate limiting
app.use('/api', apiRateLimiter);
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        platform: 'Class Connect — Student Academic Platform',
        targetSection: `CSE Section ${ENV.ALLOWED_SECTION}`,
        university: ENV.UNIVERSITY_NAME,
        timestamp: new Date().toISOString(),
    });
});
// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/user', notesAndRemindersRoutes);
app.use('/api/temporary-messages', temporaryMessageRoutes);
app.use('/api/messages', temporaryMessageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', googleDriveRoutes);
// Serve frontend static build in production (if built)
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
        if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(path.resolve(clientDist, 'index.html'));
    });
}

// 404 handler for unknown routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint ${req.originalUrl} not found.`,
    });
});
// Centralized error handling middleware
app.use(errorHandler);
export default app;

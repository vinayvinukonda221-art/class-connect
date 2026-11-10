import http from 'http';
import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socketService.js';
import { initCronJobs } from './services/cronService.js';
import { seedInitialData } from './utils/seedData.js';
const startServer = async () => {
    try {
        // 1. Connect to Database (Atlas or automatic in-memory fallback)
        await connectDB();
        // 2. Seed initial data (Section 21 admin, timetable, demo subjects)
        await seedInitialData();
        // 3. Initialize HTTP and Socket.IO server
        const server = http.createServer(app);
        initSocket(server);
        // 4. Start background cron jobs (cleaning expired messages, assignment alerts)
        initCronJobs();
        // 5. Start listening
        server.listen(ENV.PORT, '0.0.0.0', () => {
            console.log('================================================================');
            console.log(`🚀 Class Connect API Server running on http://localhost:${ENV.PORT}`);
            console.log(`🎓 Target Section: CSE Section ${ENV.ALLOWED_SECTION} (${ENV.UNIVERSITY_NAME})`);
            console.log(`📁 Google Drive Client ID: ${ENV.GOOGLE_CLIENT_ID}`);
            console.log(`🌐 Allowed Client Origin: ${ENV.CLIENT_URL}`);
            console.log('================================================================');
        });
        // Graceful Shutdown handling
        const shutdown = () => {
            console.log('\nReceived shutdown signal. Closing HTTP server gracefully...');
            server.close(() => {
                console.log('Class Connect API Server closed.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        console.error('Failed to start Class Connect server:', error.message);
        process.exit(1);
    }
};
startServer();

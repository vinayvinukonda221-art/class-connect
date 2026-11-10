import mongoose from 'mongoose';
import { ENV } from './env.js';
let memoryServer = null;
export const connectDB = async () => {
    try {
        if (ENV.MONGODB_URI && ENV.MONGODB_URI.trim() !== '') {
            console.log('Connecting to MongoDB Atlas at configured URI...');
            await mongoose.connect(ENV.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
            });
            console.log('Successfully connected to MongoDB Atlas.');
            return;
        }
        console.log('No MONGODB_URI provided. Starting in-memory MongoDB server for development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const uri = memoryServer.getUri();
        await mongoose.connect(uri);
        console.log(`Successfully connected to In-Memory MongoDB at ${uri}`);
    }
    catch (error) {
        console.warn(`Initial MongoDB connection failed (${error.message}). Attempting in-memory fallback...`);
        try {
            const { MongoMemoryServer } = await import('mongodb-memory-server');
            memoryServer = await MongoMemoryServer.create();
            const uri = memoryServer.getUri();
            await mongoose.connect(uri);
            console.log(`Fallback connected to In-Memory MongoDB at ${uri}`);
        }
        catch (fallbackError) {
            console.error('Fatal: Failed to connect to any MongoDB instance:', fallbackError.message);
            process.exit(1);
        }
    }
};
export const disconnectDB = async () => {
    await mongoose.disconnect();
    if (memoryServer) {
        await memoryServer.stop();
    }
};

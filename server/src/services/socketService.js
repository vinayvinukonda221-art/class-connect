import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
let io = null;
export const initSocket = (server) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: (origin, callback) => callback(null, true),
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    // Authentication Middleware for WebSocket Connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            const decoded = jwt.verify(token, ENV.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (!user) {
                return next(new Error('User not found'));
            }
            socket.user = user;
            next();
        }
        catch (err) {
            next(new Error('Socket authentication failed: ' + err.message));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.user;
        const section = user.section || ENV.ALLOWED_SECTION;
        // Join section room and private user room
        socket.join(`section_${section}`);
        socket.join(`user_${user._id.toString()}`);
        console.log(`Socket connected: ${user.name} (${user.rollNumber}) to section_${section}`);
        // Handle typing events for Section 21 chat
        socket.on('typing', () => {
            socket.to(`section_${section}`).emit('user_typing', {
                userId: user._id,
                userName: user.name,
            });
        });
        socket.on('stop_typing', () => {
            socket.to(`section_${section}`).emit('user_stop_typing', {
                userId: user._id,
            });
        });
        socket.on('disconnect', () => {
            // Clean up
        });
    });
    return io;
};
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized yet.');
    }
    return io;
};
export const broadcastTemporaryMessage = (section, messageData) => {
    if (io) {
        io.to(`section_${section}`).emit('new_temporary_message', messageData);
    }
};
export const broadcastDeleteMessage = (section, messageId) => {
    if (io) {
        io.to(`section_${section}`).emit('delete_temporary_message', { messageId });
    }
};
export const sendNotificationToUser = (userId, notificationData) => {
    if (io) {
        io.to(`user_${userId}`).emit('new_notification', notificationData);
    }
};
export const broadcastSectionNotification = (section, notificationData) => {
    if (io) {
        io.to(`section_${section}`).emit('section_announcement', notificationData);
    }
};

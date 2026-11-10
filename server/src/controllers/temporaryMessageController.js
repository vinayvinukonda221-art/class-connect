import { TemporaryMessage } from '../models/Note.js';
import { AppError } from '../middleware/errorHandler.js';
import { ENV } from '../config/env.js';
import { broadcastTemporaryMessage, broadcastDeleteMessage } from '../services/socketService.js';
export const getTemporaryMessages = async (req, res, next) => {
    try {
        const section = req.user?.section || ENV.ALLOWED_SECTION;
        const now = new Date();
        const messages = await TemporaryMessage.find({
            section,
            expiresAt: { $gt: now },
        })
            .populate('sender', 'name rollNumber avatar')
            .sort({ createdAt: 1 });
        res.status(200).json({ success: true, count: messages.length, messages });
    }
    catch (err) {
        next(err);
    }
};
export const postTemporaryMessage = async (req, res, next) => {
    try {
        const { message, ttlHours, isAnnouncement } = req.body;
        if (!message || message.trim() === '') {
            return next(new AppError('Message text is required.', 400));
        }
        const user = req.user;
        const section = user.section || ENV.ALLOWED_SECTION;
        const hours = ttlHours ? Math.min(Math.max(parseInt(ttlHours, 10), 1), 72) : ENV.TEMP_MESSAGE_TTL_HOURS;
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
        const tempMessage = await TemporaryMessage.create({
            sender: user._id,
            senderName: user.name,
            senderRollNumber: user.rollNumber,
            senderRole: user.role,
            message: message.trim(),
            section,
            expiresAt,
            isAnnouncement: user.role === 'admin' ? !!isAnnouncement : false,
        });
        const populated = await TemporaryMessage.findById(tempMessage._id).populate('sender', 'name rollNumber avatar');
        // Real-time delivery to all active sockets in section
        broadcastTemporaryMessage(section, populated);
        res.status(201).json({ success: true, message: 'Message sent.', data: populated });
    }
    catch (err) {
        next(err);
    }
};
export const deleteTemporaryMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const message = await TemporaryMessage.findById(messageId);
        if (!message)
            return next(new AppError('Message not found or already expired.', 404));
        // Only sender or admin can delete
        if (message.sender.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to delete this message.', 403));
        }
        await TemporaryMessage.findByIdAndDelete(messageId);
        broadcastDeleteMessage(message.section, messageId);
        res.status(200).json({ success: true, message: 'Message deleted.' });
    }
    catch (err) {
        next(err);
    }
};

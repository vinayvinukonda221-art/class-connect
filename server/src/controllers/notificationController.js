import { Notification } from '../models/Note.js';
import { AppError } from '../middleware/errorHandler.js';
export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50);
        const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
        res.status(200).json({
            success: true,
            unreadCount,
            notifications,
        });
    }
    catch (err) {
        next(err);
    }
};
export const markAsRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findOneAndUpdate({ _id: notificationId, recipient: req.user._id }, { isRead: true }, { new: true });
        if (!notification)
            return next(new AppError('Notification not found.', 404));
        res.status(200).json({ success: true, notification });
    }
    catch (err) {
        next(err);
    }
};
export const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
        res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    }
    catch (err) {
        next(err);
    }
};

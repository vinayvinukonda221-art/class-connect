import { User } from '../models/User.js';
import { Assignment, Submission } from '../models/Assignment.js';
import { Resource } from '../models/Resource.js';
import { QuestionPaper } from '../models/QuestionPaper.js';
import { TemporaryMessage, Notification } from '../models/Note.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendNotificationToUser, broadcastSectionNotification } from '../services/socketService.js';
import { ENV } from '../config/env.js';
export const getPendingUsers = async (req, res, next) => {
    try {
        const pendingUsers = await User.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: pendingUsers.length,
            users: pendingUsers,
        });
    }
    catch (err) {
        next(err);
    }
};
export const approveUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { notes } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return next(new AppError('Student account not found.', 404));
        }
        user.status = 'approved';
        user.approvalNotes = notes || 'Verified as enrolled student of CSE Section 21.';
        user.approvedBy = req.user._id;
        user.approvedAt = new Date();
        await user.save();
        // Create and dispatch real-time in-app notification to approved student
        const notif = await Notification.create({
            recipient: user._id,
            title: 'Section 21 Account Approved!',
            message: 'Your registration has been approved. Welcome to Class Connect CSE 21 portal.',
            type: 'approval',
            link: '/dashboard',
        });
        sendNotificationToUser(user._id.toString(), notif);
        res.status(200).json({
            success: true,
            message: `Student ${user.name} (${user.rollNumber}) has been approved.`,
            user,
        });
    }
    catch (err) {
        next(err);
    }
};
export const rejectUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return next(new AppError('Student account not found.', 404));
        }
        user.status = 'rejected';
        user.approvalNotes = reason || 'Registration rejected: Student not listed on Section 21 roster.';
        await user.save();
        res.status(200).json({
            success: true,
            message: `Registration for ${user.name} (${user.rollNumber}) has been rejected.`,
            user,
        });
    }
    catch (err) {
        next(err);
    }
};
export const updateUserStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { status, notes } = req.body;
        if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
            return next(new AppError('Invalid user status.', 400));
        }
        const user = await User.findById(userId);
        if (!user) {
            return next(new AppError('User not found.', 404));
        }
        if (user.role === 'admin' && status === 'suspended') {
            return next(new AppError('Cannot suspend an administrator account.', 400));
        }
        user.status = status;
        if (notes)
            user.approvalNotes = notes;
        await user.save();
        res.status(200).json({
            success: true,
            message: `User status changed to ${status}.`,
            user,
        });
    }
    catch (err) {
        next(err);
    }
};
export const getAllUsers = async (req, res, next) => {
    try {
        const { status, search, role } = req.query;
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        if (role && role !== 'all') {
            query.role = role;
        }
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [{ name: searchRegex }, { rollNumber: searchRegex }, { email: searchRegex }];
        }
        const users = await User.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    }
    catch (err) {
        next(err);
    }
};
export const getAdminStats = async (_req, res, next) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const approvedStudents = await User.countDocuments({ role: 'student', status: 'approved' });
        const pendingApprovals = await User.countDocuments({ role: 'student', status: 'pending' });
        const totalAssignments = await Assignment.countDocuments();
        const totalSubmissions = await Submission.countDocuments();
        const totalResources = await Resource.countDocuments();
        const totalPYQs = await QuestionPaper.countDocuments();
        const activeMessages = await TemporaryMessage.countDocuments({ expiresAt: { $gt: new Date() } });
        res.status(200).json({
            success: true,
            stats: {
                totalStudents,
                approvedStudents,
                pendingApprovals,
                totalAssignments,
                totalSubmissions,
                totalResources,
                totalPYQs,
                activeMessages,
                section: ENV.ALLOWED_SECTION,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
export const postAnnouncement = async (req, res, next) => {
    try {
        const { title, message } = req.body;
        if (!title || !message) {
            return next(new AppError('Title and message are required for an announcement.', 400));
        }
        const students = await User.find({ role: 'student', status: 'approved' });
        for (const student of students) {
            const notif = await Notification.create({
                recipient: student._id,
                title: `📢 Announcement: ${title}`,
                message,
                type: 'announcement',
                link: '/dashboard',
            });
            sendNotificationToUser(student._id.toString(), notif);
        }
        broadcastSectionNotification(ENV.ALLOWED_SECTION, {
            title,
            message,
            postedBy: req.user?.name || 'Administrator',
            date: new Date(),
        });
        res.status(201).json({
            success: true,
            message: 'Announcement broadcast to all approved students in Section 21.',
        });
    }
    catch (err) {
        next(err);
    }
};

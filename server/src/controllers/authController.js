import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Notification } from '../models/Note.js';
import { ENV } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { GoogleDriveService } from '../services/googleDriveService.js';
import { sendNotificationToUser } from '../services/socketService.js';
const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z
        .string()
        .email('Valid email is required')
        .refine((email) => email.endsWith('@vignan.ac.in') || email.includes('@'), 'Please use your Vignan University email'),
    rollNumber: z
        .string()
        .min(5, 'Valid roll number is required')
        .toUpperCase(),
    section: z.string().refine((sec) => sec.trim() === ENV.ALLOWED_SECTION, `Only students belonging to Section ${ENV.ALLOWED_SECTION} are permitted to register.`),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, ENV.JWT_SECRET, {
        expiresIn: ENV.JWT_EXPIRES_IN,
    });
};
export const register = async (req, res, next) => {
    try {
        const parseResult = registerSchema.safeParse(req.body);
        if (!parseResult.success) {
            const errorMsg = parseResult.error.errors.map((e) => e.message).join(', ');
            return next(new AppError(errorMsg, 400));
        }
        const { name, email, rollNumber, section, password } = parseResult.data;
        // Check if email or roll number already registered
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return next(new AppError('A user with this email already exists.', 409));
        }
        const existingRoll = await User.findOne({ rollNumber });
        if (existingRoll) {
            return next(new AppError('A student with this roll number is already registered.', 409));
        }
        // Role cannot be self-assigned as admin; all registrations are student and start as 'pending'
        const newUser = await User.create({
            name,
            email: email.toLowerCase(),
            rollNumber,
            section,
            password,
            role: 'student',
            status: 'pending',
            department: ENV.DEPARTMENT_NAME,
            university: ENV.UNIVERSITY_NAME,
        });
        // Notify any existing admins of the new registration
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            const adminNotif = await Notification.create({
                recipient: admin._id,
                title: 'New Student Registration Pending',
                message: `${name} (${rollNumber}) requested Section 21 approval.`,
                type: 'approval',
                link: '/admin',
            });
            sendNotificationToUser(admin._id.toString(), adminNotif);
        }
        // Generate token so student can view the Pending Approval screen
        const token = generateToken(newUser._id.toString(), newUser.role);
        res.status(201).json({
            success: true,
            message: 'Registration submitted successfully! Your account is currently pending administrator verification for Section 21.',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                rollNumber: newUser.rollNumber,
                section: newUser.section,
                role: newUser.role,
                status: newUser.status,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
export const login = async (req, res, next) => {
    try {
        const loginId = req.body.loginId || req.body.identifier || req.body.email || req.body.rollNumber;
        const { password } = req.body;
        if (!loginId || !password) {
            return next(new AppError('Please provide your Roll Number / Email and password.', 400));
        }
        // Allow logging in with either Roll Number or Email
        const normalized = loginId.trim();
        const user = await User.findOne({
            $or: [{ email: normalized.toLowerCase() }, { rollNumber: normalized.toUpperCase() }],
        }).select('+password');
        if (!user) {
            return next(new AppError('Invalid credentials. Check roll number/email and password.', 401));
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new AppError('Invalid credentials. Check roll number/email and password.', 401));
        }
        if (user.status === 'suspended') {
            return next(new AppError('Your account has been suspended by the Section Administrator.', 403));
        }
        const token = generateToken(user._id.toString(), user.role);
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                rollNumber: user.rollNumber,
                section: user.section,
                role: user.role,
                status: user.status,
                googleDriveConnected: user.googleDriveConnected,
                avatar: user.avatar,
                bio: user.bio,
                contactNumber: user.contactNumber,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
export const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(new AppError('Not authenticated.', 401));
        }
        const user = req.user;
        let driveStatus = { isConnected: false };
        if (user.googleDriveConnected) {
            try {
                driveStatus = await GoogleDriveService.getConnectionStatus(user._id.toString());
            }
            catch {
                driveStatus = { isConnected: true };
            }
        }
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                rollNumber: user.rollNumber,
                section: user.section,
                role: user.role,
                status: user.status,
                googleDriveConnected: user.googleDriveConnected,
                avatar: user.avatar,
                bio: user.bio,
                contactNumber: user.contactNumber,
                approvalNotes: user.approvalNotes,
                createdAt: user.createdAt,
            },
            driveStatus,
        });
    }
    catch (err) {
        next(err);
    }
};
export const updateProfile = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new AppError('Unauthorized', 401));
        const { name, email, rollNumber, bio, contactNumber, avatar } = req.body;

        // Check if updating email
        if (email && email.toLowerCase().trim() !== req.user.email?.toLowerCase()) {
            const cleanEmail = email.toLowerCase().trim();
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(cleanEmail)) {
                return next(new AppError('Please provide a valid email address.', 400));
            }
            const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: req.user._id } });
            if (existingEmail) {
                return next(new AppError('A user with this email already exists.', 409));
            }
        }

        // Check if updating roll number
        if (rollNumber && rollNumber.toUpperCase().trim() !== req.user.rollNumber?.toUpperCase()) {
            const cleanRoll = rollNumber.toUpperCase().trim();
            if (cleanRoll.length < 3) {
                return next(new AppError('Please provide a valid roll number.', 400));
            }
            const existingRoll = await User.findOne({ rollNumber: cleanRoll, _id: { $ne: req.user._id } });
            if (existingRoll) {
                return next(new AppError('A student with this roll number is already registered.', 409));
            }
        }

        const updateData = {
            ...(name && { name: name.trim() }),
            ...(email && { email: email.toLowerCase().trim() }),
            ...(rollNumber && { rollNumber: rollNumber.toUpperCase().trim() }),
            ...(bio !== undefined && { bio }),
            ...(contactNumber !== undefined && { contactNumber }),
            ...(avatar !== undefined && { avatar }),
        };

        const updated = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            user: {
                id: updated._id,
                name: updated.name,
                email: updated.email,
                rollNumber: updated.rollNumber,
                section: updated.section,
                role: updated.role,
                status: updated.status,
                googleDriveConnected: updated.googleDriveConnected,
                avatar: updated.avatar,
                bio: updated.bio,
                contactNumber: updated.contactNumber,
            },
        });
    }
    catch (err) {
        next(err);
    }
};

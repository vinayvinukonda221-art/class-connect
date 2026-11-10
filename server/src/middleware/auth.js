import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from './errorHandler.js';
export const authenticate = async (req, _res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new AppError('Authentication required. Please log in.', 401));
        }
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }
        if (user.status === 'suspended') {
            return next(new AppError('Your account has been suspended by the administrator. Contact your section admin.', 403));
        }
        req.user = user;
        req.token = token;
        next();
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid authentication token.', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Your session has expired. Please log in again.', 401));
        }
        next(error);
    }
};
export const requireApproved = (req, _res, next) => {
    if (!req.user) {
        return next(new AppError('Authentication required.', 401));
    }
    // Admins always bypass student approval check
    if (req.user.role === 'admin') {
        return next();
    }
    if (req.user.status === 'pending') {
        return next(new AppError('Your account registration for Section 21 is under admin review. Once approved, you can access course features.', 403));
    }
    if (req.user.status === 'rejected') {
        return next(new AppError('Your registration request was rejected by the administrator. Contact your section CR.', 403));
    }
    next();
};
export const requireAdmin = (req, _res, next) => {
    if (!req.user) {
        return next(new AppError('Authentication required.', 401));
    }
    if (req.user.role !== 'admin') {
        return next(new AppError('Access denied: Administrator privileges required.', 403));
    }
    next();
};

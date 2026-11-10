import rateLimit from 'express-rate-limit';
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per windowMs for auth routes
    message: {
        success: false,
        message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
export const apiRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 300, // Limit each IP to 300 requests per 5 minutes
    message: {
        success: false,
        message: 'Too many requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

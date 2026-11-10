export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const errorHandler = (err, _req, res, _next) => {
    const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
    const message = err.message || 'Internal Server Error';
    // Do not log sensitive credentials or tokens
    if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
        console.error('Unhandled Application Error:', err);
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

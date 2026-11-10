import dotenv from 'dotenv';
dotenv.config();
export const ENV = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    ALLOWED_SECTION: process.env.ALLOWED_SECTION || '21',
    UNIVERSITY_NAME: process.env.UNIVERSITY_NAME || "Vignan's Foundation for Science, Technology and Research (VFSTR)",
    DEPARTMENT_NAME: process.env.DEPARTMENT_NAME || 'Computer Science and Engineering',
    MONGODB_URI: process.env.MONGODB_URI || '',
    JWT_SECRET: process.env.JWT_SECRET || 'classconnect_super_secret_jwt_key_vfstr_cse21',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '765852818290-hss283e58ump2bfrd2ss2ahftjiqqg95.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google-drive/callback',
    GOOGLE_DRIVE_SCOPES: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ],
    TEMP_MESSAGE_TTL_HOURS: parseInt(process.env.TEMP_MESSAGE_TTL_HOURS || '24', 10),
    INITIAL_ADMIN: {
        name: process.env.INITIAL_ADMIN_NAME || 'Yashodhar Venigalla',
        email: process.env.INITIAL_ADMIN_EMAIL || 'yashodharvenigalla@gmail.com',
        rollNumber: process.env.INITIAL_ADMIN_ROLL || '241FA04693',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'classconnect@2026',
        contactNumber: process.env.INITIAL_ADMIN_PHONE || '+91 9346733056',
        section: process.env.ALLOWED_SECTION || '21',
    }
};

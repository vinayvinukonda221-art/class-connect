import mongoose, { Schema } from 'mongoose';
const noteSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Note title is required'],
        trim: true,
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
    },
    tags: [
        {
            type: String,
            trim: true,
        },
    ],
    subject: {
        type: String,
        default: '',
    },
    color: {
        type: String,
        default: '#FFFFFF',
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
export const Note = mongoose.model('Note', noteSchema);
const reminderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Reminder title is required'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    relatedModule: {
        type: String,
        enum: ['assignment', 'project', 'exam', 'personal'],
        default: 'personal',
    },
}, {
    timestamps: true,
});
export const Reminder = mongoose.model('Reminder', reminderSchema);
const temporaryMessageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderName: {
        type: String,
        required: true,
    },
    senderRollNumber: {
        type: String,
        default: '',
    },
    senderRole: {
        type: String,
        enum: ['student', 'admin', 'cr'],
        default: 'student',
    },
    message: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    section: {
        type: String,
        default: '21',
        trim: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
    isAnnouncement: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
// TTL index to automatically remove expired documents in MongoDB
temporaryMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const TemporaryMessage = mongoose.model('TemporaryMessage', temporaryMessageSchema);
const notificationSchema = new Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['assignment', 'resource', 'reminder', 'announcement', 'approval', 'system'],
        default: 'system',
    },
    link: {
        type: String,
        default: '',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
export const Notification = mongoose.model('Notification', notificationSchema);

import mongoose, { Schema } from 'mongoose';

const attachmentSchema = new Schema({
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, default: 'pdf' }, // 'pdf' | 'ppt' | 'doc' | 'drive' | 'link'
    driveFileId: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number },
    notes: { type: String, default: '' },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    uploaderName: { type: String, default: '' },
    uploaderRollNumber: { type: String, default: '' },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
});

const assignmentSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Assignment title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
    },
    subjectCode: {
        type: String,
        default: '',
        trim: true,
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
    },
    maxMarks: {
        type: Number,
        default: 100,
    },
    section: {
        type: String,
        default: '21',
        trim: true,
    },
    type: {
        type: String,
        enum: ['assignment', 'lab_observation', 'mini_project'],
        default: 'assignment',
    },
    attachments: [attachmentSchema],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    creatorName: {
        type: String,
        default: '',
    },
    creatorRollNumber: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active',
    },
}, {
    timestamps: true,
});
export const Assignment = mongoose.model('Assignment', assignmentSchema);
const submissionSchema = new Schema({
    assignment: {
        type: Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
    },
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    submissionDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['submitted', 'graded', 'late'],
        default: 'submitted',
    },
    driveFileId: { type: String },
    fileName: { type: String },
    fileUrl: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    externalLink: { type: String },
    notes: { type: String, default: '' },
    grade: { type: Number },
    feedback: { type: String, default: '' },
    gradedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
export const Submission = mongoose.model('Submission', submissionSchema);

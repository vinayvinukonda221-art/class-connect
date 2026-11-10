import mongoose, { Schema } from 'mongoose';
const projectSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Project description is required'],
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
    },
    teamMembers: [
        {
            name: { type: String, required: true },
            rollNumber: { type: String, required: true },
            email: { type: String },
            user: { type: Schema.Types.ObjectId, ref: 'User' },
        },
    ],
    leader: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['planning', 'in_progress', 'review', 'completed'],
        default: 'planning',
    },
    deadline: {
        type: Date,
    },
    githubUrl: {
        type: String,
        default: '',
    },
    driveFolderId: {
        type: String,
        default: '',
    },
    resources: [
        {
            title: { type: String, required: true },
            url: { type: String },
            driveFileId: { type: String },
        },
    ],
    progressPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    section: {
        type: String,
        default: '21',
        trim: true,
    },
}, {
    timestamps: true,
});
export const Project = mongoose.model('Project', projectSchema);

import mongoose, { Schema } from 'mongoose';
const resourceSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Resource title is required'],
        trim: true,
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
    },
    category: {
        type: String,
        enum: ['lecture', 'lab'],
        required: [true, 'Category (lecture or lab) is required'],
    },
    description: {
        type: String,
        default: '',
    },
    unit: {
        type: String,
        default: '',
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    driveFileId: {
        type: String,
        default: '',
    },
    fileUrl: {
        type: String,
        default: '',
    },
    fileName: {
        type: String,
        required: [true, 'File name is required'],
    },
    fileSize: {
        type: Number,
        default: 0,
    },
    mimeType: {
        type: String,
        default: 'application/pdf',
    },
    externalUrl: {
        type: String,
        default: '',
    },
    tags: [
        {
            type: String,
            trim: true,
        },
    ],
    section: {
        type: String,
        default: '21',
        trim: true,
    },
}, {
    timestamps: true,
});
export const Resource = mongoose.model('Resource', resourceSchema);

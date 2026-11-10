import mongoose, { Schema } from 'mongoose';
const labRecordSchema = new Schema({
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
    },
    experimentNumber: {
        type: Number,
        required: [true, 'Experiment number is required'],
    },
    experimentName: {
        type: String,
        required: [true, 'Experiment name is required'],
        trim: true,
    },
    aim: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    },
    sampleCode: {
        type: String,
        default: '',
    },
    labManualDriveId: {
        type: String,
        default: '',
    },
    labManualUrl: {
        type: String,
        default: '',
    },
    dueDate: {
        type: Date,
    },
    section: {
        type: String,
        default: '21',
        trim: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});
labRecordSchema.index({ subject: 1, experimentNumber: 1, section: 1 }, { unique: true });
export const LabRecord = mongoose.model('LabRecord', labRecordSchema);
const seminarSchema = new Schema({
    topic: {
        type: String,
        required: [true, 'Topic is required'],
        trim: true,
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
    },
    speaker: {
        type: String,
        required: [true, 'Speaker name is required'],
        trim: true,
    },
    speakerRollNumber: {
        type: String,
        default: '',
        trim: true,
    },
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    presentationDate: {
        type: Date,
        required: [true, 'Presentation date is required'],
    },
    description: {
        type: String,
        default: '',
    },
    slideDriveFileId: {
        type: String,
        default: '',
    },
    slideUrl: {
        type: String,
        default: '',
    },
    referenceUrls: [
        {
            type: String,
        },
    ],
    status: {
        type: String,
        enum: ['upcoming', 'completed', 'cancelled'],
        default: 'upcoming',
    },
    feedback: {
        type: String,
        default: '',
    },
    section: {
        type: String,
        default: '21',
        trim: true,
    },
}, {
    timestamps: true,
});
export const Seminar = mongoose.model('Seminar', seminarSchema);

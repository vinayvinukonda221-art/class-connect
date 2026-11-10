import mongoose, { Schema } from 'mongoose';
const questionPaperSchema = new Schema({
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
    examType: {
        type: String,
        enum: ['FA-1', 'FA-2', 'FA-3', 'FA-4', 'Semester-End'],
        required: [true, 'Exam type (FA-1, FA-2, FA-3, FA-4, Semester-End) is required'],
    },
    academicYear: {
        type: String,
        required: [true, 'Academic year is required (e.g. 2023-2024)'],
        trim: true,
    },
    semester: {
        type: String,
        default: 'Semester VI',
        trim: true,
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
    solutionAvailable: {
        type: Boolean,
        default: false,
    },
    solutionDriveFileId: {
        type: String,
        default: '',
    },
    solutionUrl: {
        type: String,
        default: '',
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    section: {
        type: String,
        default: '21',
        trim: true,
    },
}, {
    timestamps: true,
});
export const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);

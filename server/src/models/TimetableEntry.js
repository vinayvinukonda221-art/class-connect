import mongoose, { Schema } from 'mongoose';
const timetableEntrySchema = new Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: [true, 'Day is required'],
    },
    periodNumber: {
        type: Number,
        required: [true, 'Period number is required'],
        min: 1,
        max: 8,
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required (e.g. 08:30)'],
    },
    endTime: {
        type: String,
        required: [true, 'End time is required (e.g. 09:20)'],
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
    facultyName: {
        type: String,
        required: [true, 'Faculty name is required'],
        trim: true,
    },
    roomNumber: {
        type: String,
        required: [true, 'Room number is required'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['theory', 'lab', 'seminar', 'library', 'sports'],
        default: 'theory',
    },
    section: {
        type: String,
        default: '21',
        trim: true,
    },
}, {
    timestamps: true,
});
timetableEntrySchema.index({ day: 1, periodNumber: 1, section: 1 }, { unique: true });
export const TimetableEntry = mongoose.model('TimetableEntry', timetableEntrySchema);
const attendanceSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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
    totalClasses: {
        type: Number,
        required: true,
        default: 0,
    },
    attendedClasses: {
        type: Number,
        required: true,
        default: 0,
    },
    percentage: {
        type: Number,
        default: 0,
    },
    semester: {
        type: String,
        default: 'Semester VI',
        trim: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
attendanceSchema.pre('save', function (next) {
    if (this.totalClasses > 0) {
        this.percentage = Math.round((this.attendedClasses / this.totalClasses) * 100 * 10) / 10;
    }
    else {
        this.percentage = 0;
    }
    next();
});
attendanceSchema.index({ student: 1, subject: 1, semester: 1 }, { unique: true });
export const Attendance = mongoose.model('Attendance', attendanceSchema);

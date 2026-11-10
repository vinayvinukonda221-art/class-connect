import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    rollNumber: {
        type: String,
        required: [true, 'Roll number is required'],
        unique: true,
        uppercase: true,
        trim: true,
    },
    section: {
        type: String,
        required: [true, 'Section is required'],
        default: '21',
        trim: true,
    },
    department: {
        type: String,
        default: 'Computer Science and Engineering',
        trim: true,
    },
    university: {
        type: String,
        default: "Vignan's Foundation for Science, Technology and Research (VFSTR)",
        trim: true,
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student',
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending',
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    avatar: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        default: 'Student of CSE Section 21 at Vignan University (VFSTR)',
    },
    contactNumber: {
        type: String,
        default: '',
    },
    googleDriveConnected: {
        type: Boolean,
        default: false,
    },
    approvalNotes: {
        type: String,
        default: '',
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    approvedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password)
        return false;
    return bcrypt.compare(candidatePassword, this.password);
};
userSchema.set('toJSON', {
    transform: function (_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    },
});
export const User = mongoose.model('User', userSchema);

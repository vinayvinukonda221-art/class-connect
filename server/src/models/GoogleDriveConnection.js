import mongoose, { Schema } from 'mongoose';
const googleDriveConnectionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    tokens: {
        access_token: { type: String },
        refresh_token: { type: String },
        scope: { type: String },
        token_type: { type: String },
        expiry_date: { type: Number },
    },
    connectedEmail: {
        type: String,
        default: '',
    },
    storageQuota: {
        limit: { type: Number, default: 0 },
        usage: { type: Number, default: 0 },
        usageInDrive: { type: Number, default: 0 },
        usageInDriveTrash: { type: Number, default: 0 },
    },
    rootFolderId: {
        type: String,
        default: '',
    },
    connectedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
googleDriveConnectionSchema.set('toJSON', {
    transform: function (_doc, ret) {
        if (ret.tokens) {
            delete ret.tokens.refresh_token;
            delete ret.tokens.access_token;
        }
        delete ret.__v;
        return ret;
    },
});
export const GoogleDriveConnection = mongoose.model('GoogleDriveConnection', googleDriveConnectionSchema);

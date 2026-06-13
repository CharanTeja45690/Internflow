import mongoose, { Schema } from 'mongoose';
const notificationSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, type: { type: String, required: true }, title: { type: String, required: true }, message: String, readAt: Date, data: Schema.Types.Mixed }, { timestamps: true });
notificationSchema.index({ userId: 1, createdAt: -1 });
export const Notification = mongoose.model('Notification', notificationSchema);

import mongoose, { Schema } from 'mongoose';
const historySchema = new Schema({ from: String, to: String, changedAt: { type: Date, default: Date.now } }, { _id: false });
const applicationSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, internshipId: { type: Schema.Types.ObjectId, ref: 'Internship' }, company: { type: String, required: true }, title: { type: String, required: true }, sourceUrl: String, status: { type: String, enum: ['saved','applied','assessment','interview','offer','rejected','joined'], default: 'saved' }, notes: String, statusHistory: [historySchema], interviewLogs: [{ round: String, scheduledAt: Date, feedback: String }], followUpReminderAt: Date }, { timestamps: true });
applicationSchema.index({ userId: 1, status: 1 });
export const Application = mongoose.model('Application', applicationSchema);

import mongoose, { Schema } from 'mongoose';
const resumeSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, originalName: String, storagePath: String, storageProvider: { type: String, enum: ['local','cloudinary'], default: 'local' }, secureUrl: String, text: String, status: { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' }, analysis: { resumeScore: Number, skillMatrix: [{ name: String, confidence: Number }], atsIssues: [String], recommendations: [String], embedding: [Number] }, processedAt: Date }, { timestamps: true });
resumeSchema.index({ userId: 1, createdAt: -1 });
export const Resume = mongoose.model('Resume', resumeSchema);

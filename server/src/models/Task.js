import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true }, title: { type: String, required: true }, description: String, priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' }, status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED'], default: 'TODO' }, dueDateKey: String, estimatedMinutes: Number, actualMinutes: Number, category: String, tags: [String], completedAt: Date, deletedAt: Date }, { timestamps: true });
schema.index({ userId: 1, status: 1, dueDateKey: 1 });
export default mongoose.model('Task', schema);

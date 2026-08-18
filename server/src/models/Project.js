import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: String,
  status: { type: String, enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED'], default: 'ACTIVE' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  startDateKey: String,
  deadlineKey: String,
  tags: [String],
  deletedAt: Date
}, { timestamps: true });

schema.index({ userId: 1, status: 1 });
schema.index({ userId: 1, deadlineKey: 1 });
export default mongoose.model('Project', schema);

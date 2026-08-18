import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: String,
  dateKey: String,
  completed: { type: Boolean, default: false },
  completedAt: Date
}, { timestamps: true });

schema.index({ userId: 1, projectId: 1, dateKey: 1 });
export default mongoose.model('ProjectMilestone', schema);

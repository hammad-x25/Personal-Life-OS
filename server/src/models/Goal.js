import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true }, title: { type: String, required: true }, description: String, category: String, target: Number, currentProgress: { type: Number, default: 0 }, unit: String, deadlineKey: String, priority: String, status: { type: String, default: 'ACTIVE' }, milestones: [{ title: String, description: String, deadlineKey: String, completed: Boolean, completedAt: Date }], deletedAt: Date }, { timestamps: true });
export default mongoose.model('Goal', schema);

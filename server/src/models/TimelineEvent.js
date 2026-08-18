import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: String,
  entityId: mongoose.Types.ObjectId,
  entityType: String,
  dateKey: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

schema.index({ userId: 1, timestamp: -1 });
export default mongoose.model('TimelineEvent', schema);

import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  type: String,
  title: String,
  message: String,
  entityId: mongoose.Types.ObjectId,
  scheduledFor: Date,
  readAt: Date,
  status: { type: String, enum: ['PENDING', 'SENT', 'DISMISSED'], default: 'PENDING' }
}, { timestamps: true });

schema.index({ userId: 1, readAt: 1 });
schema.index({ userId: 1, status: 1, scheduledFor: -1 });
export default mongoose.model('Notification', schema);

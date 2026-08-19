import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  category: String,
  dateKey: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  priority: { type: String, default: 'MEDIUM' },
  color: String,
  notes: String,
  status: { type: String, enum: ['PLANNED', 'COMPLETED', 'PARTIAL', 'MISSED'], default: 'PLANNED' },
  recurrence: { type: { type: String, default: 'NONE' }, weekdays: [Number], endDateKey: String },
  deletedAt: Date
}, { timestamps: true });

schema.index({ userId: 1, dateKey: 1, startTime: 1 });
export default mongoose.model('TimetableEvent', schema);

import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  habitId: { type: mongoose.Types.ObjectId, ref: 'Habit', required: true, index: true },
  dateKey: { type: String, required: true },
  targetValue: Number,
  actualValue: { type: Number, min: 0 },
  completionPercentage: { type: Number, min: 0, max: 100 },
  status: { type: String, enum: ['PLANNED', 'COMPLETED', 'PARTIAL', 'SKIPPED', 'MISSED'], default: 'PLANNED' },
  loggedAt: Date
}, { timestamps: true });

schema.index({ userId: 1, habitId: 1, dateKey: 1 }, { unique: true });
schema.index({ userId: 1, dateKey: 1, status: 1 });
export default mongoose.model('HabitInstance', schema);

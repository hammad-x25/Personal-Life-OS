import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  habitId: { type: mongoose.Types.ObjectId, ref: 'Habit', required: true, index: true },
  dateKey: { type: String, required: true },
  targetValue: Number,
  actualValue: { type: Number, min: 0, required: true },
  completionPercentage: { type: Number, min: 0, max: 100 },
  status: { type: String, enum: ['COMPLETED', 'PARTIAL', 'SKIPPED', 'MISSED'], required: true },
  notes: String
}, { timestamps: true });

schema.index({ userId: 1, habitId: 1, dateKey: 1 }, { unique: true });
export default mongoose.model('HabitLog', schema);

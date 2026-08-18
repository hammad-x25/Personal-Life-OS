import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  periodKey: { type: String, required: true },
  startDateKey: String,
  endDateKey: String,
  score: Number,
  previousScore: Number,
  growthPercentage: Number,
  componentAverages: mongoose.Schema.Types.Mixed,
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

schema.index({ userId: 1, periodKey: 1 }, { unique: true });
export default mongoose.model('WeeklyPerformance', schema);

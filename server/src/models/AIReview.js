import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  reviewType: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY'], required: true },
  periodKey: { type: String, required: true },
  startDateKey: String,
  endDateKey: String,
  score: Number,
  growthPercentage: Number,
  summary: String,
  strengths: [String],
  weaknesses: [String],
  recommendations: [String],
  priority: String,
  estimatedGrowth: Number,
  model: String,
  promptVersion: String,
  status: { type: String, enum: ['GENERATING', 'COMPLETED', 'FAILED'], default: 'GENERATING' },
  errorMessage: String,
  generatedAt: Date
}, { timestamps: true });

schema.index({ userId: 1, reviewType: 1, periodKey: 1 }, { unique: true });
export default mongoose.model('AIReview', schema);

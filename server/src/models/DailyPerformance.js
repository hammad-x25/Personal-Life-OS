import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  dateKey: { type: String, required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  components: { type: mongoose.Schema.Types.Mixed, default: {} },
  weights: { type: mongoose.Schema.Types.Mixed, default: {} },
  sourceDataVersion: { type: String, default: 'v1' },
  generatedAt: { type: Date, default: Date.now },
  isFinal: { type: Boolean, default: true }
}, { timestamps: true });

schema.index({ userId: 1, dateKey: 1 }, { unique: true });
export default mongoose.model('DailyPerformance', schema);

import mongoose from 'mongoose';

const contribution = new mongoose.Schema({ amount: { type: Number, min: 0, required: true }, dateKey: String, note: String }, { _id: true });
const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: String,
  targetAmount: { type: Number, min: 0, required: true },
  currentAmount: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: 'PKR' },
  startDateKey: String,
  deadlineKey: String,
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'], default: 'ACTIVE' },
  contributions: [contribution],
  deletedAt: Date
}, { timestamps: true });

schema.index({ userId: 1, status: 1, deadlineKey: 1 });
export default mongoose.model('FinancialGoal', schema);

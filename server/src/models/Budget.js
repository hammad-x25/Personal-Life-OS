import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: null },
  periodType: { type: String, enum: ['MONTHLY', 'WEEKLY'], default: 'MONTHLY' },
  amount: { type: Number, min: 0, required: true },
  currency: { type: String, default: 'PKR' },
  startDateKey: String,
  endDateKey: String,
  active: { type: Boolean, default: true },
  deletedAt: Date
}, { timestamps: true });

schema.index({ userId: 1, active: 1, category: 1 });
export default mongoose.model('Budget', schema);

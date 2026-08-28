import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  type: { type: String, enum: ['EXPENSE', 'INCOME'], default: 'EXPENSE' },
  deletedAt: Date
}, { timestamps: true });

schema.index({ userId: 1, name: 1, type: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
export default mongoose.model('FinanceCategory', schema);

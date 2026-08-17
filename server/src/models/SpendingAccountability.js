import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true }, dateKey: { type: String, required: true }, totalSpent: { type: Number, min: 0, required: true }, expenseCount: { type: Number, min: 0, required: true }, status: { type: String, enum: ['PENDING', 'ACCOUNTED'], default: 'ACCOUNTED' }, source: { type: String, enum: ['EXPENSES_CONFIRMED', 'NO_SPENDING'], required: true }, notes: String, submittedAt: Date }, { timestamps: true });
schema.index({ userId: 1, dateKey: 1 }, { unique: true });
export default mongoose.model('SpendingAccountability', schema);

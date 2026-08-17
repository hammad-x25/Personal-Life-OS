import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true }, type: { type: String, enum: ['EXPENSE', 'INCOME'], default: 'EXPENSE' }, amount: { type: Number, min: 0, required: true }, category: { type: String, required: true }, subcategory: String, paymentMethod: String, description: String, notes: String, dateKey: { type: String, required: true }, occurredAt: Date, isRecurring: Boolean, deletedAt: Date }, { timestamps: true });
schema.index({ userId: 1, dateKey: 1 });
export default mongoose.model('Expense', schema);

import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true }, dateKey: { type: String, required: true }, phoneUsageMinutes: { type: Number, min: 0, required: true }, mood: Number, energyLevel: Number, sleepMinutes: Number, notes: String, submittedAt: Date }, { timestamps: true });
schema.index({ userId: 1, dateKey: 1 }, { unique: true });
export default mongoose.model('PhoneUsage', schema);

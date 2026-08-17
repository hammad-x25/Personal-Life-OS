import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true }, title: { type: String, required: true }, description: String, frequencyType: { type: String, default: 'DAILY' }, weekdays: [Number], planStartDateKey: String, planEndDateKey: String, dailyTarget: Number, targetUnit: String, minimumAcceptable: Number, preferredTime: String, status: { type: String, default: 'ACTIVE' } }, { timestamps: true });
export default mongoose.model('Habit', schema);

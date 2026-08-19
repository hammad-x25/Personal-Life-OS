import mongoose from 'mongoose';
const exercise = new mongoose.Schema({ name: { type: String, required: true }, muscleGroup: String, sets: Number, repetitions: Number, durationMinutes: Number, distance: Number }, { _id: false });
const schema = new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true }, name: { type: String, required: true }, description: String, status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' }, schedule: [{ weekday: Number, exercises: [exercise] }] }, { timestamps: true });
export default mongoose.model('ExercisePlan', schema);

import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true }, planId: { type: mongoose.Types.ObjectId, ref: 'ExercisePlan' }, dateKey: { type: String, required: true }, workoutType: { type: String, required: true }, completed: { type: Boolean, default: true }, exercises: [{ name: String, sets: Number, repetitions: Number, weight: Number, durationMinutes: Number, distance: Number, calories: Number }], notes: String }, { timestamps: true });
schema.index({ userId: 1, dateKey: 1 });
export default mongoose.model('ExerciseLog', schema);

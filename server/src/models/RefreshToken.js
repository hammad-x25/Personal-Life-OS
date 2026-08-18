import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  familyId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
  replacedByTokenId: mongoose.Types.ObjectId,
  userAgent: String,
  ipAddress: String
}, { timestamps: true });

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model('RefreshToken', schema);

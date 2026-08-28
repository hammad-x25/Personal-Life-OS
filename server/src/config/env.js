import "dotenv/config";
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const accessSecret = process.env.ACCESS_TOKEN_SECRET || (isProduction ? '' : 'development-access-secret');
const refreshSecret = process.env.REFRESH_TOKEN_SECRET || (isProduction ? '' : 'development-refresh-secret');
if (isProduction && (!accessSecret || accessSecret.length < 32 || !refreshSecret || refreshSecret.length < 32)) throw new Error('Production requires ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET of at least 32 characters');
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(value => value.trim()).filter(Boolean);
export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/life_os",
  accessSecret,
  refreshSecret,
  accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || "30d",
  clientUrl: clientUrls[0],
  clientUrls,
  cookieSecure: process.env.COOKIE_SECURE === 'true' || isProduction,
  trustProxy: process.env.TRUST_PROXY === 'true' || isProduction,
  aiApiKey: process.env.AI_API_KEY || '',
  aiApiUrl: process.env.AI_API_URL || '',
  aiModel: process.env.AI_MODEL || '',
  jobsEnabled: process.env.ENABLE_JOBS === 'true',
};

import "dotenv/config";
export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/life_os",
  accessSecret: process.env.ACCESS_TOKEN_SECRET || "development-access-secret",
  refreshSecret:
    process.env.REFRESH_TOKEN_SECRET || "development-refresh-secret",
  accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || "30d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};

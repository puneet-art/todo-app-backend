import "dotenv/config";
const env = process.env.NODE_ENV || "development";
const config = {
  env,
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
export default config;

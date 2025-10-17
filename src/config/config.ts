import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const env = process.env.NODE_ENV || "development";
const envPath = path.resolve(process.cwd(), `.env.${env}`);

dotenv.config({
  path: fs.existsSync(envPath) ? envPath : path.resolve(process.cwd(), ".env"),
});

export const CONFIG = {
  NODE_ENV: env,
  SERVER: process.env.SERVER || "localhost",
  PORT: process.env.PORT || 8001,
  DB_TYPE: process.env.DB_TYPE,
  DB_HOST: process.env.DB_HOST!,
  DB_PORT: 3306,
  DB_USER: process.env.DB_USER!,
  DB_PASS: process.env.DB_PASSWORD!,
  DB_NAME: process.env.DB_NAME!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
};

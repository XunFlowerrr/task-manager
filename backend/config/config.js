import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT,
  databaseURL: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  logLevel: process.env.LOG_LEVEL,
  nodeENV: process.env.NODE_ENV,
}

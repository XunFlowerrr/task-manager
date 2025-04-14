import dotenv from 'dotenv';
dotenv.config();

interface Config {
  port: string | undefined;
  databaseURL: string | undefined;
  jwtSecret: string | undefined;
  logLevel: string | undefined;
  nodeENV: string | undefined;
}

export const config: Config = {
  port: process.env.PORT,
  databaseURL: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  logLevel: process.env.LOG_LEVEL,
  nodeENV: process.env.NODE_ENV,
}

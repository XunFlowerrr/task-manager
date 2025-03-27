import { createLogger, format, transports } from "winston";
import { config } from "./config/config.js";

const { combine, timestamp, label, printf, colorize } = format;
const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] [${level}]: ${message}`;
});

export const logger = (fileLabel) =>
  createLogger({
    level: config.logLevel,
    format: combine(
      label({ label: fileLabel }),
      timestamp(),
      colorize(),
      logFormat
    ),
    transports: [new transports.Console()],
  });

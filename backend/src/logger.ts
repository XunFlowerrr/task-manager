import { createLogger, format, transports, Logger } from "winston";
import { config } from "./config/config.js";

const { combine, timestamp, label, printf, colorize } = format;
const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] [${level}]: ${message}`;
});

export const logger = (fileLabel: string): Logger =>
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

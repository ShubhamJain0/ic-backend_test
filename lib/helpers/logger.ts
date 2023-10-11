import winston from "winston";

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(
    (info) => `${info.timestamp} - ${info.level}: ${info.message}`
  )
);

const logger = winston.createLogger({
  level: "error",
  format: logFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }), // Log errors to a file
  ],
});

export default logger;

import pino from "pino";

const logger = pino({
  transport:
    process.env.NODE_ENV == "dev"
      ? {
          target: "pino-pretty",
        }
      : undefined,
});

export default logger;

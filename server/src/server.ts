import AwsClientManager from "./aws/AwsClientManager";
import { Config } from "./config/default";
import express from "express";
import {
  sendBulkPushHandler,
  sendPushHandler,
} from "./handlers/notificationHandler";
import { DB } from "./storage/DB";
import { createScheduleHandler } from "./handlers/scheduleHandler";
import logger from "./lib/logger";
import SQS from "./aws/SQS";
import Scheduler from "./aws/Scheduler";

export class Server {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public async run() {
    await DB.init(this.config.db);

    const db = DB.getInstance();

    setInterval(async () => {
      try {
        if (!db.getHealthCheck()) {
          logger.info("Database is not healthy, attempting to reconnect...");
          await db.connect();
        }
        await db.ping();
      } catch (error) {
        logger.error("Error during database health check or reconnect:", error);
      }
    }, 10000);

    AwsClientManager.init(this.config.aws);

    SQS.init(AwsClientManager.getInstance().sqsClient, this.config.aws);
    Scheduler.init(
      AwsClientManager.getInstance().schedulerClient,
      this.config.aws
    );

    const app = express();
    const port = this.config.port;

    app.use(express.json());

    app.get("/health", (req, res) => {
      res.status(200).json({
        status: DB.getInstance().getHealthCheck() ? "UP" : "DOWN",
      });
    });

    app.post("/schedule", createScheduleHandler);
    app.post("/push/send/bulk", sendBulkPushHandler);
    app.post("/push/send", sendPushHandler);

    app.listen(port, () => {
      logger.info(`Server is running at ${this.config.port}`);
    });
  }
}

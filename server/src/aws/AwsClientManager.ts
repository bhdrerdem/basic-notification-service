import { SQSClient } from "@aws-sdk/client-sqs";
import { AwsConfig } from "../config/default";
import { SchedulerClient } from "@aws-sdk/client-scheduler";

class AwsClientManager {
  private static instance: AwsClientManager;
  private _sqsClient: SQSClient | null = null;
  private _schedulerClient: SchedulerClient | null = null;

  private config: AwsConfig;

  constructor(config: AwsConfig) {
    this.config = config;
  }

  public static init(config: AwsConfig) {
    if (!this.instance) {
      AwsClientManager.instance = new AwsClientManager(config);
    }
  }

  public static getInstance(): AwsClientManager {
    if (!this.instance) {
      throw new Error("AwsClientManager is not initialized");
    }
    return this.instance;
  }

  get sqsClient(): SQSClient {
    if (!this._sqsClient) {
      this._sqsClient = new SQSClient({
        region: this.config.region,
      });
    }
    return this._sqsClient;
  }

  get schedulerClient(): SchedulerClient {
    if (!this._schedulerClient) {
      this._schedulerClient = new SchedulerClient({
        region: this.config.region,
      });
    }
    return this._schedulerClient;
  }
}

export default AwsClientManager;

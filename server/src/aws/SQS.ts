import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { AwsConfig } from "../config/default";

class SQS {
  private static instance: SQS;
  private sqsClient: SQSClient;
  private config: AwsConfig;

  constructor(sqsClient: SQSClient, config: AwsConfig) {
    this.sqsClient = sqsClient;
    this.config = config;
  }

  public static init(sqsClient: SQSClient, config: AwsConfig) {
    if (!this.instance) {
      SQS.instance = new SQS(sqsClient, config);
    }
  }

  public static getInstance(): SQS {
    if (!this.instance) {
      throw new Error("SQS is not initialized");
    }
    return this.instance;
  }

  async sendToPushQueue(message: string, userId: number): Promise<void> {
    await this.sendMessage(
      this.config.pushQueueUrl,
      message,
      `push-notification-user-${userId}`
    );
  }

  private async sendMessage(
    queueUrl: string,
    messageBody: string,
    messageGroupId: string,
    delaySeconds?: number
  ): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: messageBody,
        DelaySeconds: delaySeconds || 0,
        MessageGroupId: messageGroupId,
      });

      await this.sqsClient.send(command);
    } catch (error) {
      throw error;
    }
  }
}

export default SQS;

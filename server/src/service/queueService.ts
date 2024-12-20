import SQS from "../aws/SQS";

class QueueService {
  public async sendToPushQueue(message: string, userId: number): Promise<void> {
    await SQS.getInstance().sendToPushQueue(message, userId);
  }
}

export const queueService = new QueueService();

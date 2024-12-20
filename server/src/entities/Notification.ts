export type NotificationStatus = "pending" | "queued" | "sent" | "failed";
export type NotificationType = "PUSH" | "EMAIL" | "SMS";

export abstract class Notification {
  id?: number;
  userId: number;
  templateId: string;
  type: NotificationType;
  title: string;
  body: string;
  status: NotificationStatus;
  metadata: any;
  createdAt: Date;
  sentAt?: Date | null;

  constructor(data: {
    userId: number;
    templateId: string;
    type: NotificationType;
    title: string;
    body: string;
    status: NotificationStatus;
    metadata?: any;
    createdAt?: Date;
  }) {
    this.userId = data.userId;
    this.templateId = data.templateId;
    this.type = data.type;
    this.title = data.title;
    this.body = data.body;
    this.status = data.status;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date();
    this.sentAt = null;
  }

  markAsSent(): void {
    this.status = "sent";
    this.sentAt = new Date();
  }

  markAsFailed(error: Error): void {
    this.status = "failed";
    this.sentAt = new Date();
    this.metadata = { ...this.metadata, error: error.message };
  }

  toJson(): Record<string, any> {
    return {
      id: this.id,
      userId: this.userId,
      templateId: this.templateId,
      type: this.type,
      title: this.title,
      body: this.body,
      status: this.status,
      metadata: JSON.stringify(this.metadata),
      createdAt: this.createdAt.toISOString(),
      sentAt: this.sentAt?.toISOString() || null,
    };
  }
}

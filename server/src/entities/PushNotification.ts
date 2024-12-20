import { Notification, NotificationStatus } from "./Notification";

export class PushNotification extends Notification {
  pushToken: string;
  oneSignalId: string;
  queryParam: Record<string, any>;

  constructor(data: {
    userId: number;
    templateId: string;
    title: string;
    body: string;
    status: NotificationStatus;
    pushToken: string;
    oneSignalId: string;
    queryParam: Record<string, any>;
    metadata?: any;
    createdAt?: Date;
  }) {
    super({
      ...data,
      type: "PUSH",
      metadata: {
        ...data.metadata,
        pushToken: data.pushToken,
        oneSignalId: data.oneSignalId,
      },
    });
    this.pushToken = data.pushToken;
    this.oneSignalId = data.oneSignalId;
    this.queryParam = data.queryParam;
  }
}

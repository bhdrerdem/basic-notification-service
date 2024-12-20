import { Notification, NotificationStatus } from "../entities/Notification";
import { DB } from "../storage/DB";

export type NotificationType = "push";

export abstract class NotificationService {
  protected async create(notification: Notification): Promise<Notification> {
    const sql = `
    INSERT INTO notifications (user_id, template_id, type, title, body, status, metadata, created_at, sent_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id;
  `;

    const params = [
      notification.userId,
      notification.templateId,
      notification.type,
      notification.title,
      notification.body,
      notification.status,
      JSON.stringify(notification.metadata),
      notification.createdAt,
      notification.sentAt,
    ];

    const result = await DB.getInstance().query<{ id: number }>(sql, params);

    if (result.length > 0) {
      notification.id = result[0].id;
    } else {
      throw new Error("Failed to save notification.");
    }

    return notification;
  }

  protected async updateStatus(
    notification: Notification,
    status: NotificationStatus
  ): Promise<Notification> {
    notification.status = status;

    const sql = `
    UPDATE notifications
    SET status = $2
    WHERE id = $1;
  `;

    await DB.getInstance().query(sql, [notification.id, status]);

    return notification;
  }
}

import { User } from "../entities/User";
import { Notification } from "../entities/Notification";
import { NotificationTemplate } from "../entities/Template";
import { NotificationService } from "./notificationService";
import { PushNotification } from "../entities/PushNotification";
import { templateService } from "./templateService";
import { userService } from "./userService";
import logger from "../lib/logger";
import { queueService } from "./queueService";

class PushNotificationService extends NotificationService {
  async prepareAndDispatchNotification(
    user: User,
    template: NotificationTemplate
  ): Promise<Notification> {
    try {
      let notification = await this.prepareNotification(user, template);
      notification = (await super.create(notification)) as PushNotification;
      await this.sendToQueue(notification);
      try {
        await super.updateStatus(notification, "queued");
      } catch (error) {
        logger.error(
          {
            notificationId: notification.id,
            templateId: template.id,
            userId: user.id,
            err: error,
          },
          "Failed to update notification status to queued"
        );
      }
      return notification;
    } catch (error) {
      logger.error(
        {
          templateId: template.id,
          userId: user.id,
          err: error,
        },
        "Failed to prepare and dispatch notification"
      );
      throw error;
    }
  }

  private async prepareNotification(
    user: User,
    template: NotificationTemplate
  ): Promise<PushNotification> {
    const message = await templateService.validateAndRender(template, user);

    const notifDetails = await userService.getUserPushNotificationDetails(user);
    if (notifDetails == null) {
      throw new Error(
        `Push notification details not found for user ${user.id}`
      );
    }

    if (!notifDetails.oneSignalId || !notifDetails.pushToken) {
      throw new Error(
        `user ${user.id} does not have a push token or OneSignal ID`
      );
    }

    const notification = new PushNotification({
      userId: user.id,
      templateId: template.id,
      title: message.title,
      body: message.body,
      status: "pending",
      pushToken: notifDetails.pushToken,
      oneSignalId: notifDetails.oneSignalId,
      queryParam: template.queryParam || {},
    });

    return notification;
  }

  private async sendToQueue(notification: PushNotification): Promise<void> {
    try {
      const message = JSON.stringify({
        notificationId: notification.id,
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        userPushToken: notification.pushToken,
        oneSignalId: notification.oneSignalId,
        queryParam: notification.queryParam,
      });

      await queueService.sendToPushQueue(message, notification.userId);
    } catch (error) {
      throw error;
    }
  }
}

export const pushNotificationService = new PushNotificationService();

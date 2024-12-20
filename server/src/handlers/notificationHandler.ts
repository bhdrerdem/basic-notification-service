import { Request, Response } from "express";
import { segmentService, segmentTableMapping } from "../service/segmentService";
import { templateService } from "../service/templateService";
import { userService } from "../service/userService";
import { pushNotificationService } from "../service/pushNotificationService";
import logger from "../lib/logger";

async function sendBulkPushHandler(req: Request, res: Response) {
  const { templateId, segment } = req.body;
  if (!templateId || !segment) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    if (!Object.keys(segmentTableMapping).includes(segment)) {
      res.status(400).json({ error: `Invalid segment ${segment}` });
      return;
    }

    const template = await templateService.getById(templateId);
    if (!template) {
      res.status(400).json({ error: `Template ${templateId} not found` });
      return;
    }

    res.status(200).json({ message: "Bulk send started" });

    (async () => {
      try {
        await segmentService.processUsersInSegment(segment, async (user) => {
          await pushNotificationService.prepareAndDispatchNotification(
            user,
            template
          );
        });
      } catch (error) {
        logger.error(
          {
            segment,
            templateId,
            err: error,
          },
          "Failed to send bulk messages"
        );
      }
    })();
  } catch (error) {
    logger.error(
      {
        templateId,
        segment,
        err: error,
      },
      "Failed to send bulk messages"
    );
    res.status(500).json({ error: "Failed to send bulk messages" });
  }
}

async function sendPushHandler(req: Request, res: Response) {
  const { templateId, userId } = req.body;

  if (!templateId || !userId) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  try {
    const user = await userService.getById(userId);
    if (!user) {
      return res.status(404).json({
        error: `User ${userId} not found`,
      });
    }

    // TODO: Check if user has opted in for push notifications
    // if (!user.pushNotificationsEnabled) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "User has not opted in for push notifications"
    //   });
    // }

    const template = await templateService.getById(templateId);
    if (!template) {
      return res.status(404).json({
        error: `Template ${templateId} not found`,
      });
    }

    const notification =
      await pushNotificationService.prepareAndDispatchNotification(
        user,
        template
      );

    return res.status(200).json(notification.toJson());
  } catch (error) {
    logger.error(
      {
        templateId,
        userId,
        err: error,
      },
      "Failed to send push notification"
    );
    return res.status(500).json({
      error: "Failed to process notification",
    });
  }
}

export { sendBulkPushHandler, sendPushHandler };

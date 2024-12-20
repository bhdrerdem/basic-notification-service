import { Request, Response } from "express";
import { segmentTableMapping } from "../service/segmentService";
import { templateService } from "../service/templateService";
import logger from "../lib/logger";
import { NotificationTemplate } from "../entities/Template";
import { schedulerService } from "../service/schedulerService";

async function createScheduleHandler(req: Request, res: Response) {
  const { name, scheduleType, templateId, schedule, segment, timezone } =
    req.body;

  if (
    !name ||
    !scheduleType ||
    !templateId ||
    !schedule ||
    !segment ||
    !timezone
  ) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (!Object.keys(segmentTableMapping).includes(segment)) {
    res.status(400).json({ error: `Invalid segment ${segment}` });
    return;
  }

  if (!schedulerService.isValidTimezone(timezone)) {
    res.status(400).json({ error: "Invalid timezone" });
    return;
  }

  if (scheduleType !== "one-time" && scheduleType !== "cron") {
    res.status(400).json({
      error:
        "Invalid schedule type. Please provide a valid type: either 'cron' or 'one-time'.",
    });
    return;
  }

  let template: NotificationTemplate | null;
  try {
    template = await templateService.getById(templateId);
    if (!template) {
      res.status(404).json({ error: `Template ${templateId} not found` });
      return;
    }
  } catch (error) {
    logger.error(
      {
        templateId,
        err: error,
      },
      "Failed to get template by id"
    );
    res.status(500).json({ error: "Something went wrong, please try again." });
    return;
  }

  const scheduleExpression =
    scheduleType === "one-time"
      ? schedulerService.formatOneTimeSchedule(schedule)
      : schedulerService.formatCronSchedule(schedule);
  if (scheduleExpression == null) {
    res.status(400).json({ error: "Invalid schedule format" });
    return;
  }

  const scheduleName = `${name.replace(/ /g, "_").trim()}`;

  try {
    await schedulerService.createSchedule(
      scheduleName,
      scheduleExpression,
      timezone,
      {
        templateId: template.id,
        segment,
      }
    );

    res.status(200).json({ message: "Schedule created" });
  } catch (error) {
    logger.error(
      {
        name,
        scheduleType,
        templateId,
        schedule,
        segment,
        timezone,
        err: error,
      },
      "Failed to create schedule"
    );
    res.status(500).json({ error: "Failed to create schedule" });
    return;
  }
}

export { createScheduleHandler };

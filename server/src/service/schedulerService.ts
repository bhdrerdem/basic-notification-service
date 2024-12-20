import Scheduler from "../aws/Scheduler";

class SchedulerService {
  async createSchedule(
    name: string,
    scheduleExpression: string,
    timezone: string,
    input: object
  ) {
    await Scheduler.getInstance().createSchedule(
      name,
      scheduleExpression,
      timezone,
      input
    );
  }

  formatOneTimeSchedule(schedule: string): string | null {
    const dateTime = new Date(schedule);
    if (isNaN(dateTime.getTime())) {
      return null;
    }

    const year = dateTime.getUTCFullYear();
    const month = String(dateTime.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dateTime.getUTCDate()).padStart(2, "0");
    const hours = String(dateTime.getUTCHours()).padStart(2, "0");
    const minutes = String(dateTime.getUTCMinutes()).padStart(2, "0");
    const seconds = String(dateTime.getUTCSeconds()).padStart(2, "0");

    return `at(${year}-${month}-${day}T${hours}:${minutes}:${seconds})`;
  }

  formatCronSchedule(schedule: string): string | null {
    const regexString =
      "^((\\d+(,\\d+)*|(\\d+(\\/|-|#)\\d+)|\\d+L?|\\*(\\/\\d+)?|L(-\\d+)?|\\?|[A-Z]{3}(\\-[A-Z]{3})?)\\s?){6}$";

    const regex = new RegExp(regexString);

    if (!regex.test(schedule)) {
      return null;
    }

    return `cron(${schedule})`;
  }

  isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }
}

export const schedulerService = new SchedulerService();

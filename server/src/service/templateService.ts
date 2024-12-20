import { NotificationTemplate } from "../entities/Template";
import { User } from "../entities/User";
import logger from "../lib/logger";
import { DB } from "../storage/DB";
import { userService } from "./userService";

class TemplateService {
  async getById(id: string): Promise<NotificationTemplate | null> {
    try {
      const resp = await DB.getInstance().query<NotificationTemplate>(
        `SELECT * FROM notification_templates WHERE id = $1`,
        [id]
      );

      if (resp.length === 0) {
        return null;
      }

      return NotificationTemplate.fromDB(resp[0]);
    } catch (error) {
      logger.error(
        {
          templateId: id,
          err: error,
        },
        "Failed to get template by id"
      );
      throw error;
    }
  }

  async validateAndRender(
    template: NotificationTemplate,
    user: User
  ): Promise<{ title: string; body: string }> {
    if (template.requiredFields.length) {
      for (const field of template.requiredFields) {
        const userField = user.getField(field as keyof User);
        if (!userField) {
          await userService.getField(user, field as keyof User);
        }
      }
    }

    return {
      title: template.renderTitle(user),
      body: template.renderBody(user),
    };
  }
}

export const templateService = new TemplateService();

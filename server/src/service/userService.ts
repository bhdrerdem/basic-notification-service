import { User } from "../entities/User";
import { UserPushNotification } from "../entities/UserPushNotification";
import logger from "../lib/logger";
import { DB } from "../storage/DB";

class UserService {
  async getById(id: string): Promise<User | null> {
    const resp = await DB.getInstance().query<User>(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );

    if (resp.length === 0) {
      return null;
    }

    return User.fromDB(resp[0]);
  }

  async getField(user: User, field: keyof User): Promise<void> {
    const query = user.getFieldQuery(field);
    if (!query) {
      throw new Error(`Field "${field}" is not supported for user.`);
    }

    try {
      const [result] = await DB.getInstance().query<string[]>(query);

      if (result === undefined) {
        throw new Error(`Query returned no results for field "${field}".`);
      }

      const value = Object.values(result)[0];
      if (value === undefined) {
        throw new Error(`Failed to extract value for field "${field}".`);
      }

      user.setField(field, value);
    } catch (error) {
      logger.error(
        {
          user: user.id,
          field,
          err: error,
        },
        "Failed to get field for user"
      );
      throw error;
    }
  }

  async getFromSegment(
    segmentTable: string,
    offset: number,
    limit: number
  ): Promise<User[]> {
    const users = await DB.getInstance().query<User>(
      `
      SELECT u.*
      FROM ${segmentTable} s
      INNER JOIN users u ON s.user_id = u.id
      LIMIT ${limit} OFFSET ${offset}
      `
    );

    return users.map((user) => User.fromDB(user));
  }

  async getUserPushNotificationDetails(
    user: User
  ): Promise<UserPushNotification | null> {
    const resp = await DB.getInstance().query<UserPushNotification>(
      `SELECT * 
       FROM "user_push_notification" 
       WHERE "user_id" = $1 
       ORDER BY "created_date" DESC 
       LIMIT 1`,
      [user.id]
    );

    if (resp.length === 0) {
      return null;
    }

    return UserPushNotification.fromDB(resp[0]);
  }
}

export const userService = new UserService();

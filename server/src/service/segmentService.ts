import { User } from "../entities/User";
import logger from "../lib/logger";
import { userService } from "./userService";

export const segmentTableMapping = {
  non_premium_users: "user_segments_non_premium",
};

export type Segment = keyof typeof segmentTableMapping;

class SegmentService {
  async processUsersInSegment(
    segment: Segment,
    processUser: (user: User) => Promise<void>
  ) {
    const tableName = segmentTableMapping[segment];

    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let errorCount = 0;

    while (hasMore && errorCount < 3) {
      try {
        const users = await userService.getFromSegment(
          tableName,
          offset,
          limit
        );
        if (users.length === 0) {
          hasMore = false;
          return;
        }

        for (const user of users) {
          try {
            await processUser(user);
          } catch (error) {
            logger.error(
              {
                segment,
                user: user.id,
                err: error,
              },
              "Failed to process user"
            );
          }
        }

        offset += limit;
      } catch (error) {
        logger.error(
          {
            segment,
            err: error,
          },
          "Failed to fetch users from segment"
        );
        errorCount++;
        if (errorCount > 3) {
          logger.error(
            {
              segment,
              err: error,
            },
            "Failed to fetch users from segment after 3 retries"
          );
          hasMore = false;
        }
      }
    }
  }
}

export const segmentService = new SegmentService();

import logger from "../lib/logger";

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) throw error;
    logger.info(
      `Retrying operation ${operation.name}, attempts left: ${retries}`,
      error
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryOperation(operation, retries - 1, delay);
  }
};

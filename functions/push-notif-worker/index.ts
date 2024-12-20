import { SQSEvent, SQSHandler } from "aws-lambda";
import * as OneSignal from "@onesignal/node-onesignal";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secretName = "prod/onesignal";
const region = "eu-central-1";

const secretsManagerClient = new SecretsManagerClient({ region });

let cachedSecrets: {
  ONE_SIGNAL_API_KEY: string;
  ONE_SIGNAL_APP_ID: string;
} | null = null;

const fetchSecrets = async (): Promise<{
  ONE_SIGNAL_API_KEY: string;
  ONE_SIGNAL_APP_ID: string;
}> => {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  try {
    const response = await secretsManagerClient.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );

    if (!response.SecretString) {
      throw new Error("Secrets Manager response does not contain SecretString");
    }

    cachedSecrets = JSON.parse(response.SecretString);
    return cachedSecrets as {
      ONE_SIGNAL_API_KEY: string;
      ONE_SIGNAL_APP_ID: string;
    };
  } catch (error) {
    console.error("Error fetching secrets from Secrets Manager:", error);
    throw error;
  }
};

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  try {
    const { ONE_SIGNAL_API_KEY, ONE_SIGNAL_APP_ID } = await fetchSecrets();

    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      console.log("Processing message:", message);

      const configuration = OneSignal.createConfiguration({
        restApiKey: ONE_SIGNAL_API_KEY,
      });
      const oneSignalClient = new OneSignal.DefaultApi(configuration);

      const notificationParams = {
        app_id: ONE_SIGNAL_APP_ID,
        contents: { en: "test" },
        included_segments: ["All"],
      };

      const notification = await oneSignalClient.createNotification(
        notificationParams
      );
      console.log("Notification sent successfully:", notification);

      // TODO: Update the notification status in the database
    }
  } catch (error) {
    console.error("Error processing SQS message:", error);
    throw error;
  }
};

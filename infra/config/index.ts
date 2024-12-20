import * as dotenv from "dotenv";
dotenv.config();

export type Config = {
  oneSignalSecretArn: string;
  imageUrl: string;
};

export default {
  oneSignalSecretArn: process.env.ONE_SIGNAL_SECRET_ARN || "",
  imageUrl: process.env.IMAGE_URL || "",
} as Config;

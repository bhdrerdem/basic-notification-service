import * as dotenv from "dotenv";
dotenv.config();

export type DBConfig = {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
};

export type AwsConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  pushQueueUrl: string;
  scheduler: {
    targetArn: string;
    targetRoleArn: string;
  };
};

export type Config = {
  port: number;
  db: DBConfig;
  aws: AwsConfig;
};

export default {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "adm1n",
    database: process.env.DB_NAME || "postgres",
    port: parseInt(process.env.DB_PORT || "5432"),
  } as DBConfig,
  aws: {
    region: process.env.AWS_REGION || "eu-central-1",
    pushQueueUrl: process.env.PUSH_QUEUE_URL || "",
    scheduler: {
      targetArn: process.env.SCHEDULER_TARGET_ARN || "",
      targetRoleArn: process.env.SCHEDULER_TARGET_ROLE_ARN || "",
    },
  } as AwsConfig,
} as Config;

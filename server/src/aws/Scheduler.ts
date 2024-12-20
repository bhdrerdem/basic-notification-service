import {
  CreateScheduleCommand,
  SchedulerClient,
} from "@aws-sdk/client-scheduler";
import { AwsConfig } from "../config/default";
import { retryOperation } from "../utils";

export default class ScheduleService {
  private static instance: ScheduleService;
  private schedulerClient: SchedulerClient;

  private config: AwsConfig;

  constructor(schedulerClient: SchedulerClient, config: AwsConfig) {
    this.schedulerClient = schedulerClient;
    this.config = config;
  }

  public static init(schedulerClient: SchedulerClient, config: AwsConfig) {
    if (!this.instance) {
      ScheduleService.instance = new ScheduleService(schedulerClient, config);
    }
  }

  public static getInstance(): ScheduleService {
    if (!this.instance) {
      throw new Error("ScheduleService is not initialized");
    }
    return this.instance;
  }

  async createSchedule(
    name: string,
    scheduleExpression: string,
    timezone: string,
    input: object
  ) {
    const command = new CreateScheduleCommand({
      Name: name,
      ScheduleExpression: scheduleExpression,
      ScheduleExpressionTimezone: timezone,
      Target: {
        Arn: this.config.scheduler.targetArn,
        RoleArn: this.config.scheduler.targetRoleArn,
        Input: JSON.stringify(input),
      },
      FlexibleTimeWindow: {
        Mode: "OFF",
      },
    });

    await retryOperation(() => this.schedulerClient.send(command));
  }
}

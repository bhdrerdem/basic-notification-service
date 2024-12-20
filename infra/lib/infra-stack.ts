import { type Config } from "../config";

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as ecsp from "aws-cdk-lib/aws-ecs-patterns";
import * as ecs from "aws-cdk-lib/aws-ecs";

export interface StackProps extends cdk.StackProps, Config {}

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    if (props.oneSignalSecretArn === "") {
      throw new Error("ONE_SIGNAL_SECRET_ARN is required");
    }

    const vpc = new ec2.Vpc(this, "NotifVpc", {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "notifPublicSubnet",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "notifPrivateSubnet",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, "RdsSecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });

    const postgres = new rds.DatabaseInstance(this, "PostgresqlInstance", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13,
      }),
      instanceType: new ec2.InstanceType("t3.micro"),
      allocatedStorage: 20,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      credentials: rds.Credentials.fromGeneratedSecret("postgres"),
      databaseName: "notifdb",
      securityGroups: [rdsSecurityGroup],
      publiclyAccessible: true,
    });

    postgres.connections.allowFrom(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432),
      "Allow inbound traffic from all"
    );

    const dlq = new sqs.Queue(this, "DeadLetterQueue", {
      queueName: "NotificationPushDLQ.fifo",
      fifo: true,
      retentionPeriod: cdk.Duration.days(14),
    });

    const sqsQueue = new sqs.Queue(this, "SqsQueue", {
      queueName: "NotificationPush.fifo",
      fifo: true,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: dlq,
      },
    });

    const pushNotifWorkerLambda = new lambda.Function(
      this,
      "PushNotifWorkerLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset("../functions/push-notif-worker/dist"),
      }
    );

    sqsQueue.grantConsumeMessages(pushNotifWorkerLambda);

    pushNotifWorkerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.oneSignalSecretArn],
      })
    );

    pushNotifWorkerLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(sqsQueue, {
        batchSize: 1,
        enabled: true,
      })
    );

    const notifSenderLambda = new lambda.Function(this, "NotifSenderLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../functions/notif-sender/dist"),
    });

    const execRole = new iam.Role(this, "NotificationServiceExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    execRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonECSTaskExecutionRolePolicy"
      )
    );

    const taskRole = new iam.Role(this, "NotificationServiceTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonEventBridgeSchedulerFullAccess"
      )
    );

    const notificationService = new ecsp.ApplicationLoadBalancedFargateService(
      this,
      "NotificationService",
      {
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry(props.imageUrl),
          containerPort: 8080,
          environment: {
            DB_HOST: postgres.dbInstanceEndpointAddress,
            DB_USER: "postgres",
            DB_PASSWORD: postgres
              .secret!.secretValueFromJson("password")
              .unsafeUnwrap(),
            DB_NAME: "notifdb",
            DB_PORT: postgres.dbInstanceEndpointPort,
            PUSH_QUEUE_URL: sqsQueue.queueUrl,
            SCHEDULER_TARGET_ARN: notifSenderLambda.functionArn,
            SCHEDULER_TARGET_ROLE_ARN: notifSenderLambda.role!.roleArn,
            PORT: "8080",
          },
          taskRole,
          executionRole: execRole,
        },
        runtimePlatform: {
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
          cpuArchitecture: ecs.CpuArchitecture.ARM64,
        },
        publicLoadBalancer: true,
        desiredCount: 1,
        memoryLimitMiB: 512,
        cpu: 256,
        vpc,
      }
    );

    notifSenderLambda.addEnvironment(
      "API_URL",
      notificationService.loadBalancer.loadBalancerDnsName
    );

    notificationService.targetGroup.configureHealthCheck({
      path: "/health",
    });

    sqsQueue.grantSendMessages(notificationService.taskDefinition.taskRole);
  }
}

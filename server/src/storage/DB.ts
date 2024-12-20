import postgres from "postgres";
import { DBConfig } from "../config/default";
import logger from "../lib/logger";

export class DB {
  private static instance: DB;
  private sql!: postgres.Sql<any>;
  private health: boolean = false;
  private config: DBConfig;

  private constructor(config: DBConfig) {
    this.config = config;
  }

  public async connect(): Promise<void> {
    try {
      this.sql = postgres({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        username: this.config.user,
        password: this.config.password,
      });

      await this.sql`SELECT 1`;
      this.health = true;
      logger.info("Connected to database");
    } catch (error) {
      logger.error(
        {
          err: error,
        },
        "Database connection failed"
      );
      this.health = false;
      throw error;
    }
  }

  public static getInstance(): DB {
    if (!DB.instance || !DB.instance.getHealthCheck()) {
      throw new Error("DB instance not initialized");
    }
    return DB.instance;
  }

  public static async init(config: DBConfig): Promise<void> {
    if (!DB.instance) {
      DB.instance = new DB(config);
    }

    await DB.instance.connect();
  }

  public getHealthCheck(): boolean {
    return this.health;
  }

  public async ping(): Promise<void> {
    try {
      await this.sql`SELECT 1`;
    } catch (error) {
      logger.error(
        {
          err: error,
        },
        "Database ping failed"
      );
      this.health = false;
      throw error;
    }
  }

  public async query<T>(query: string, params?: any[]): Promise<T[]> {
    return await this.sql.unsafe(query, params || []);
  }

  public async close(): Promise<void> {
    await this.sql.end();
    logger.info("Database connection closed");
  }
}

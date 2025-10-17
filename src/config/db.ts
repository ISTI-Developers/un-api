import mysql, { Pool, PoolOptions } from "mysql2/promise";
import { CONFIG } from "./config";
interface DatabaseConfig extends PoolOptions {
  host?: string;
  user?: string;
  password?: string;
  database?: string;
  port?: number;
}

export class MySQL {
  private pool: Pool;
  private config: DatabaseConfig;

  constructor(config?: DatabaseConfig) {
    this.config = {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "unmg-workplace",
      port: Number(process.env.DB_PORT) || 3306,
      connectionLimit: 10,
      ...config, // override any default via constructor
    };

    this.pool = mysql.createPool(this.config);
    console.log(
      `✅ Connected to MySQL at ${this.config.host}:${this.config.port}`
    );
  }

  async query<T extends mysql.ResultSetHeader = any>(
    sql: string,
    params?: any[]
  ): Promise<T[]> {
    const [rows] = await this.pool.query<T[]>(sql, params);
    return rows;
  }

  // Close pool gracefully
  async close(): Promise<void> {
    await this.pool.end();
    console.log("🛑 MySQL pool closed.");
  }
}

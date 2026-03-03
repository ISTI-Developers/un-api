import mysql, { Pool, PoolOptions } from "mysql2/promise";
import sql, { ConnectionPool, IResult } from "mssql";
import { CONFIG } from "./config";
interface DatabaseConfig extends PoolOptions {
  host?: string;
  user?: string;
  password?: string;
  database?: string;
  port?: number;
}

export interface MsSQLDatabaseConfig {
  server?: string;
  user?: string;
  password?: string;
  database?: string;
  port?: number;
  pool?: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
  };
  options?: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
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
      `✅ Connected to MySQL at ${this.config.host}:${this.config.port}`,
    );
  }

  async query<T extends mysql.ResultSetHeader = any>(
    sql: string,
    params?: any[],
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

export class MSSQL {
  private pool: ConnectionPool;
  private config: sql.config;

  constructor(config?: MsSQLDatabaseConfig) {
    this.config = {
      server: process.env.QNE_DB_HOST || "qnebss",
      user: process.env.QNE_DB_USER || "sa",
      password: process.env.QNE_DB_PASSWORD || "",
      database: process.env.QNE_DATABASE || "UTASI_LIVEDB",
      port: Number(process.env.DB_PORT) || 20306,

      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },

      options: {
        encrypt: false, // true for Azure
        trustServerCertificate: true, // local dev
      },
      requestTimeout: 60000,
      connectionTimeout: 60000,
      ...config,
    };

    this.pool = new sql.ConnectionPool(this.config);

    this.pool
      .connect()
      .then(() => {
        console.log(
          `✅ Connected to MSSQL at ${this.config.server}:${this.config.port}`,
        );
      })
      .catch((err) => {
        console.error("❌ MSSQL connection failed:", err);
        throw err;
      });
  }

  async query<T = any>(
    sqlQuery: string,
    params?: Record<string, any>,
    timeout = 60000, // allow override
  ): Promise<T[]> {
    const request = new sql.Request(this.pool);
    (request as any).requestTimeout = timeout;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
      }
    }

    const result: IResult<T> = await request.query(sqlQuery);
    return result.recordset;
  }

  async close(): Promise<void> {
    await this.pool.close();
    console.log("🛑 MSSQL pool closed.");
  }
}

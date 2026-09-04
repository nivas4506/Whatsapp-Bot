import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

export class Database {
  private static instance: Database;
  public pool: pg.Pool;
  private isConnected: boolean = false;

  private constructor() {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      host: config.PGHOST,
      port: config.PGPORT,
      user: config.PGUSER,
      password: config.PGPASSWORD,
      database: config.PGDATABASE,
      ssl: config.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
      max: config.PGPOOL_MAX,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected error on idle client:', err);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async query<T extends pg.QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<pg.QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (config.LOG_LEVEL === 'debug') {
        console.debug('[PostgreSQL Query]', { text, duration, rows: res.rowCount });
      }
      return res;
    } catch (error) {
      console.error('[PostgreSQL Query Error]', { text, error });
      throw error;
    }
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const res = await this.query('SELECT 1 as alive');
      this.isConnected = res.rows.length > 0;
      return this.isConnected;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = Database.getInstance();

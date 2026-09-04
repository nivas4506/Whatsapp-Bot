import pg from 'pg';
export declare class Database {
    private static instance;
    pool: pg.Pool;
    private isConnected;
    private constructor();
    static getInstance(): Database;
    query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>>;
    isHealthy(): Promise<boolean>;
    close(): Promise<void>;
}
export declare const db: Database;

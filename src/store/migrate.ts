import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  console.log('[Migration] Checking database connectivity...');
  const isHealthy = await db.isHealthy();
  if (!isHealthy) {
    throw new Error('Database is not reachable. Ensure PostgreSQL is running.');
  }

  // Create migrations tracking table if not exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const checkRes = await db.query(
      'SELECT id FROM schema_migrations WHERE version = $1',
      [file]
    );

    if (checkRes.rows.length === 0) {
      console.log(`[Migration] Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[Migration] Successfully applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migration] Failed to apply ${file}:`, err);
        throw err;
      } finally {
        client.release();
      }
    } else {
      console.log(`[Migration] Already applied: ${file}`);
    }
  }
}

// Allow direct execution: `tsx src/store/migrate.ts`
if (process.argv[1] && process.argv[1].includes('migrate.ts')) {
  runMigrations()
    .then(() => {
      console.log('[Migration] All migrations completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Migration error:', err.message);
      process.exit(1);
    });
}

// Tiger Cloud (TimescaleDB) connection for the shadow deployment. Separate from db.ts on purpose so it can
// be removed, or promoted to the primary, without touching the Heroku path.
import pg from 'pg';
import { TIGER_DATABASE_SSL, TIGER_DATABASE_URL, TIGER_MIRROR_TIMEOUT } from './config.js';

export function isTigerEnabled(): boolean {
  return !!TIGER_DATABASE_URL;
}

let pool: pg.Pool | undefined;

export function getTigerPool(): pg.Pool {
  if (!TIGER_DATABASE_URL) {
    throw new Error('TIGER_DATABASE_URL is not set');
  }
  if (!pool) {
    let ssl: boolean | { rejectUnauthorized: false } = { rejectUnauthorized: false };
    if (TIGER_DATABASE_SSL === 'true') ssl = true;
    if (TIGER_DATABASE_SSL === 'false') ssl = false;
    pool = new pg.Pool({
      connectionString: TIGER_DATABASE_URL,
      ssl,
      max: 10,
      // keep connections warm between request bursts (TLS setup to another region is expensive)
      idleTimeoutMillis: 10 * 60 * 1000,
      keepAlive: true,
      // never let a slow Tiger call hang a caller: statement + connect timeouts
      statement_timeout: TIGER_MIRROR_TIMEOUT * 1000,
      connectionTimeoutMillis: 10_000,
    });
    // a pool-level error (e.g. a dropped idle connection) must never crash the process
    pool.on('error', () => {});
  }
  return pool;
}

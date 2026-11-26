import type { ClientConfig, PoolConfig } from 'pg';
import pg from 'pg';
import {
  DATABASE_MAX_POOL_SIZE,
  DATABASE_MIN_POOL_SIZE,
  DATABASE_SSL,
  DATABASE_STATEMENT_TIMEOUT,
  DATABASE_URL,
  DATABASE_URL_SOURCE,
} from './config.js';
import createKnex, { Knex } from 'knex';
import PgConnectionConfig = Knex.PgConnectionConfig;
import { format, fromUnixTime } from 'date-fns';
import { getLoggerFor } from './log.js';

const logger = getLoggerFor('db');

const pgTimestampWithTzFormat = 'yyyy-MM-dd HH:mm:ssxx';

export function dateToTimestamp(date: Date): string {
  return format(date, pgTimestampWithTzFormat);
}

export function unixToTimestamp(unix: number): string {
  return dateToTimestamp(fromUnixTime(unix));
}

export function createClientConfig(): ClientConfig {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  // Default to rejectUnauthorized: false as per existing codebase
  let ssl: boolean | { rejectUnauthorized: false } = { rejectUnauthorized: false };
  switch (DATABASE_SSL) {
    case 'true':
      ssl = true;
      break;
    case 'false':
      ssl = false;
      break;
  }

  return {
    connectionString: DATABASE_URL,
    ssl,
  };
}

/** For the pools only: a statement that hangs must not hold a request or a snapshot forever. */
function createPooledClientConfig(): ClientConfig {
  return {
    ...createClientConfig(),
    statement_timeout: DATABASE_STATEMENT_TIMEOUT * 1000,
    keepAlive: true,
  };
}

export function createPoolConfig(): PoolConfig {
  return {
    ...createPooledClientConfig(),
    min: DATABASE_MIN_POOL_SIZE,
    max: DATABASE_MAX_POOL_SIZE,
    // keep connections open between request bursts, and give up on a connection attempt after 10s
    idleTimeoutMillis: 10 * 60 * 1000,
    connectionTimeoutMillis: 10_000,
  };
}

export function createClient(): pg.Client {
  return new pg.Client(createClientConfig());
}

function createPool(): pg.Pool {
  logger.info('Using the database in %s', DATABASE_URL_SOURCE);
  const pool = new pg.Pool(createPoolConfig());
  // an idle connection dropped by the server must not take the process down
  pool.on('error', e => logger.warn(e, 'Idle database connection failed'));
  return pool;
}

let pool: pg.Pool | undefined;

export function getPool() {
  if (!pool) {
    pool = createPool();
  }

  return pool;
}

function createQueryBuilder() {
  return createKnex({
    client: 'pg',
    connection: createPooledClientConfig() as unknown as PgConnectionConfig,
    pool: { min: DATABASE_MIN_POOL_SIZE, max: DATABASE_MAX_POOL_SIZE },
  });
}

let queryBuilder: Knex | undefined;

export function getQueryBuilder() {
  if (!queryBuilder) {
    queryBuilder = createQueryBuilder();
  }

  return queryBuilder;
}

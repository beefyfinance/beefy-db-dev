import type { ClientConfig } from 'pg';
import pg from 'pg';
import { DATABASE_SSL, DATABASE_URL } from './config.js';
import createKnex, { Knex } from 'knex';
import PgConnectionConfig = Knex.PgConnectionConfig;

export function createClientConfig(): ClientConfig {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  // Default to rejectUnauthorized: false as per existing codebase
  // TODO: check if live database is using self-signed certs/still needs this
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
    connectionString: process.env['DATABASE_URL'],
    ssl,
  };
}

export function createClient(): pg.Client {
  return new pg.Client(createClientConfig());
}

function createPool(): pg.Pool {
  return new pg.Pool(createClientConfig());
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
    connection: createClientConfig() as PgConnectionConfig,
    pool: { min: 0, max: 10 },
  });
}

let queryBuilder: Knex | undefined;

export function getQueryBuilder() {
  if (!queryBuilder) {
    queryBuilder = createQueryBuilder();
  }

  return queryBuilder;
}

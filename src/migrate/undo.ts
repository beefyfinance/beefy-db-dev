import { join } from 'node:path';
import * as url from 'node:url';
import { createInterface } from 'node:readline/promises';
import Postgrator from 'postgrator';
import { createClient } from '../common/db.js';
import { getLoggerFor } from '../common/log.js';
import { NODE_ENV } from '../common/config.js';

const logger = getLoggerFor('migrate:undo');
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

async function undoMigrate() {
  if (NODE_ENV !== 'development') {
    throw new Error('Can only undo migrations in development environment');
  }

  logger.info('Starting...');
  const client = createClient();

  if (!client.database) {
    throw new Error('DATABASE_URL did not have a database name');
  }

  logger.debug('Connecting to database...');
  await client.connect();

  const postgrator = new Postgrator({
    migrationPattern: join(__dirname, '/../../migrations/*'),
    driver: 'pg',
    database: client.database,
    schemaTable: 'migrations',
    currentSchema: 'public',
    execQuery: query => client.query(query),
  });

  const latest = await postgrator.getMaxVersion();
  logger.info('Latest schema version: %d', latest);

  const current = await postgrator.getDatabaseVersion();
  logger.info('Current schema version: %d', current);

  if (current === 0) {
    logger.info('Can not undo past version 0');
    return;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  const previous = current - 1;
  if ((await rl.question(`Undo from version ${current} to ${previous}? (y/N) \n`)) !== 'y') {
    return;
  }

  logger.info('Running migrations...');
  const result = await postgrator.migrate(previous.toString());

  if (result.length === 0) {
    throw new Error('No migrations ran');
  } else {
    logger.info('Migration done.');
  }
}

undoMigrate()
  .then(() => process.exit(0))
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });

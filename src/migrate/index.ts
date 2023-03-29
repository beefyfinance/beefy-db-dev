import { join } from 'node:path';
import * as url from 'node:url';
import Postgrator from 'postgrator';
import { createClient } from '../common/db.js';
import { getLoggerFor } from '../common/log.js';

const logger = getLoggerFor('migrate');
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

async function migrate() {
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

  const current = await postgrator.getDatabaseVersion();
  logger.info('Current schema version: %d', current);

  const latest = await postgrator.getMaxVersion();
  logger.info('Latest schema version: %d', latest);

  if (current === latest) {
    logger.info(`
No migrations run,
Already at latest one,
Up-to-date, job done.`);
    return;
  }

  logger.info('Running migrations...');
  const result = await postgrator.migrate('max');

  if (result.length === 0) {
    throw new Error('No migrations ran');
  } else {
    logger.info('Migration done.');
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });

import { logger } from './logger.js';
import {
  performRefreshWithRetries,
  performScheduledUpdate,
  performUpdateWithRetries,
} from './update.js';
import { getLastSnapshot, getNextSnapshot } from './utils.js';
import { SNAPSHOT_INTERVAL, VIEW_REFRESH_INTERVAL } from '../common/config.js';

async function run() {
  logger.info('Starting...');

  const lastSnapshot = await getLastSnapshot();
  logger.info('Last snapshot: %d', lastSnapshot);

  // Check for restart in same snapshot interval
  const nextSnapshot = getNextSnapshot();

  // align next snapshot to interval
  const waitSeconds = Math.ceil(nextSnapshot + SNAPSHOT_INTERVAL - Date.now() / 1000);
  logger.info(
    'Waiting %ds to align next scheduled snapshot to the %ds interval',
    waitSeconds,
    SNAPSHOT_INTERVAL
  );
  setTimeout(() => {
    // update on interval
    scheduleUpdate();
    // do this update
    performScheduledUpdate();
  }, waitSeconds * 1000);

  setTimeout(async () => {
    // refresh on interval
    scheduleViewRefresh();
    await performRefreshWithRetries();
  }, 60 * 1000);

  // perform a snapshot now if we missed one and next is more than 1 minute away
  if (nextSnapshot > lastSnapshot && waitSeconds > 60) {
    // update on startup
    logger.info('Missed a snapshot while offline, performing now:');
    await performUpdateWithRetries();
  }
}

function scheduleUpdate() {
  logger.info('Scheduling update every %ds', SNAPSHOT_INTERVAL);
  setInterval(performScheduledUpdate, SNAPSHOT_INTERVAL * 1000);
}

function scheduleViewRefresh() {
  logger.info('Scheduling materialized view refresh every %ds', VIEW_REFRESH_INTERVAL);
  setInterval(performRefreshWithRetries, VIEW_REFRESH_INTERVAL * 1000);
}

run().catch(e => {
  logger.error(e);
  process.exit(1);
});

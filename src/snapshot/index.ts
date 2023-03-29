import { logger } from './logger.js';
import { performScheduledUpdate, performUpdateWithRetries } from './update.js';
import { getLastSnapshot, getNextSnapshot } from './utils.js';
import { SNAPSHOT_INTERVAL } from '../common/config.js';

async function run() {
  logger.info('Starting...');

  const lastSnapshot = await getLastSnapshot();
  logger.info('Last snapshot: %d', lastSnapshot);

  // Check for restart in same snapshot interval
  const nextSnapshot = getNextSnapshot();
  if (nextSnapshot > lastSnapshot) {
    // update on interval
    scheduleUpdate();
    // update on startup
    logger.info('Missed a snapshot, updating now');
    await performUpdateWithRetries();
  } else {
    // wait
    const wait = (nextSnapshot + SNAPSHOT_INTERVAL - Date.now() / 1000) * 1000;
    logger.info('Waiting %ds for next snapshot', (wait / 1000).toFixed(4));
    setTimeout(() => {
      // update on interval
      scheduleUpdate();
      // update on startup after wait
      performScheduledUpdate();
    }, wait);
  }
}

function scheduleUpdate() {
  logger.info('Scheduling update every %ds', SNAPSHOT_INTERVAL);
  setInterval(performScheduledUpdate, SNAPSHOT_INTERVAL * 1000);
}

run().catch(e => {
  logger.error(e);
  process.exit(1);
});

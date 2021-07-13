const { existsSync, writeFileSync, unlinkSync } = require('fs');

const { LOCK_FILE } = require('./constants');
const { log } = require('./log');
const { sleep } = require('./utils');
const { init, update } = require('./core');

async function main () {
  log.info('beefy-db start');

  try {
    if (existsSync(LOCK_FILE)) {
      log.error('another instance is already running');
      process.exit(-1);
    }

    log.debug('locking db');
    writeFileSync(LOCK_FILE, Date.now().toString());
    log.debug('db locked');

    await init();
    setTimeout(update, 1000);

    // TODO: start API endpoint
    await sleep(10 * 60 * 1000);
    
  } catch (err) {
    log.error(err);
    throw err;
  }

  if (existsSync(LOCK_FILE)) {
    log.debug('unlocking db');
    unlinkSync(LOCK_FILE);
    log.debug('db unlocked');
  }
}

main();
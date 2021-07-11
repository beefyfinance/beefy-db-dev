const { existsSync, writeFileSync, unlinkSync, readFileSync } = require('fs');

const { log } = require('./log');
const { LOCK_FILE } = require('./constants');

async function main () {
  log.info('beefy-db start');

  try {
    if (existsSync(LOCK_FILE)) {
      log.error('another instance is already running');
      process.exit(-1);
    }

    log.debug('locking mutex');
    writeFileSync(LOCK_FILE, Date.now().toString());
    log.debug('mutex locked');

    // fetch TVL
    // fetch APY
    // fetch prices
    // persist data
    // sleep
    // loop

  } catch (err) {
    log.error(err);
    throw err;
  }  

  if (existsSync(LOCK_FILE)) {
    log.debug('unlocking mutex');
    unlinkSync(LOCK_FILE);
    log.debug('mutex unlocked');
  }
}

main();
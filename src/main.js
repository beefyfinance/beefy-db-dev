const { existsSync, writeFileSync, unlinkSync, readFileSync } = require('fs');

const { LOCK_FILE } = require('./constants');
const { FETCH_INTERVAL, ERROR_INTERVAL } = require('./cfg');

const { log } = require('./log');
const { sleep } = require('./utils');
const { fetchTvl, fetchApy, fetchPrice } = require('./fetch');

let running = true;

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

    // TODO: launch this as a thread
    while (running) {
      const [tvl, apy, price] = Promise.all([
        fetchTvl(), fetchApy(), fetchPrice()
      ]);

      // TODO: store data
      log.log('TVL');
      log.log(tvl);
      running = false;

      await sleep(FETCH_INTERVAL);
    }
    
  } catch (err) {
    log.error(err);
    await sleep(ERROR_INTERVAL);
  }  

  if (existsSync(LOCK_FILE)) {
    log.debug('unlocking db');
    unlinkSync(LOCK_FILE);
    log.debug('db unlocked');
  }
}

process.on('SIGINT', function() {
  log.info('SIGINT received');
  running = false;
});

main();
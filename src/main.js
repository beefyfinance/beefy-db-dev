const { existsSync, writeFileSync, unlinkSync } = require('fs');

const { LOCK_FILE } = require('./utils/constants');
const { log } = require('./utils/log');
const { sleep } = require('./utils/utils');
const snapshot = require('./data/snapshot');
const api = require('./api/api');

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

    log.debug('initializing');
    await snapshot.init();
    await api.init();

    log.debug('listening');
    setTimeout(snapshot.update, 1000);
    api.listen();

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
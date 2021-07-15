const { existsSync, writeFileSync } = require('fs');

const { LOCK_FILE } = require('./utils/constants');
const { log } = require('./utils/log');
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

    log.info('initializing modules');
    await snapshot.init();
    await api.init();
    
    log.info('modules ready');
    // FIXME: tmp disable
    // setTimeout(snapshot.update, 1000);
    api.listen();

  } catch (err) {
    log.error(err);
    throw err;
  }
}

main();
const { existsSync, writeFileSync, readFileSync } = require('fs');

const { HOUR_IN_MILLIS, SNAP_FILE } = require('../utils/constants');
const { SNAPSHOT_INTERVAL, UPDATE_INTERVAL } = require('../utils/cfg');
const { log } = require('../utils/log');

const db = require('./db');
const { fetchApy, fetchLps, fetchPrice, fetchTvl } = require('./fetch');
const { transformApy, transformPrice, transformTvl } = require('./transform');

async function init () {
  log.info(`updating data`);
  await db.connect();
  await db.migrate();
}

async function update () {
  log.info(`updating snapshot`);
  
  try {
    const t = Math.floor(Date.now() / (SNAPSHOT_INTERVAL * 1000)) * SNAPSHOT_INTERVAL;

    if (!hasSnapshot(t)){
      await snapshot(t);
    }
  } catch (err) {
    log.error(err);
  }
  
  setTimeout(update, UPDATE_INTERVAL * 1000);
  log.info(`updated snapshot`);
}

function hasSnapshot (t) {
  log.debug(`checking last snapshot`);

  if (!existsSync(SNAP_FILE)) {
    log.debug(`snapshot not found`);
    return false;
  }

  log.debug(`snapshot found`);
  const last = Number(readFileSync(SNAP_FILE));
  return last === t;
}

async function snapshot (t) {
  const [apy, lps, price, tvl] = await Promise.all([
    fetchApy(t),
    fetchLps(t),
    fetchPrice(t),
    fetchTvl(t),
  ]);

  await Promise.all([
    db.insert("apys", transformApy(apy.data || {}, t)),
    db.insert("prices", transformPrice(lps.data || {}, t)),
    db.insert("prices", transformPrice(price.data || {}, t)),
    db.insert("tvls", transformTvl(tvl.data || {}, t)), 
  ]);

  writeFileSync(SNAP_FILE, t.toString());
}

module.exports = {
  init,
  update
}
const { HOUR, HOUR_IN_MILLIS} = require('./constants');
const { UPDATE_INTERVAL, ERROR_INTERVAL } = require('./cfg');

const { log } = require('./log');
const db = require('./db');
const { fetchApy, fetchPrice, fetchTvl } = require('./fetch');
const { transformApy, transformPrice, transformTvl } = require('./transform');

async function init () {
  log.info(`updating data`);
  await db.connect();
  await db.migrate();
}

async function update () {
  log.info(`updating snapshot`);
  try {
    const t = Math.floor(Date.now() / HOUR_IN_MILLIS) * HOUR;
    const [apy, price, tvl] = await Promise.all([
      fetchApy(t),
      fetchPrice(t),
      fetchTvl(t), 
    ]);

    await Promise.all([
      db.insert("apys", transformApy(apy.data || {}, t)),
      db.insert("prices", transformPrice(price.data || {}, t)),
      db.insert("tvls", transformTvl(tvl.data || {}, t)), 
    ]);

    setTimeout(update, UPDATE_INTERVAL);

  } catch (err) {
    log.error(err);
    setTimeout(update, ERROR_INTERVAL);
  }
  log.info(`updated snapshot`);
}

module.exports = {
  init,
  update
}
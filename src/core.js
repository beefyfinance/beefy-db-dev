const { UPDATE_INTERVAL, ERROR_INTERVAL } = require('./cfg');

const { log } = require('./log');
const { fetchApy, fetchPrice, fetchTvl } = require('./fetch');
const db = require('./db');

async function init () {
  log.info(`updating data`);
  await db.connect();

  // Create tables if they don't exist

}

async function update () {
  log.info(`updating snapshot`);
  try {
    const t = Math.floor(Date.now() / (60 * 60 * 1000));
    const [apy, price, tvl] = await Promise.all([
      fetchApy(t),
      fetchPrice(t),
      fetchTvl(t), 
    ]);

    await Promise.all([
      db.persistApy(apy, t),
      db.persistPrice(price, t),
      db.persistTvl(tvl, t), 
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
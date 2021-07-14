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
    const t = Math.floor(Date.now() / (60 * 60 * 1000));
    const [apy, price, tvl] = await Promise.all([
      fetchApy(t),
      fetchPrice(t),
      fetchTvl(t), 
    ]);

    await Promise.all([
      db.insert("apys", t, transformApy(apy.data || {})),
      db.insert("prices", t, transformPrice(price.data || {})),
      db.insert("tvls", t, transformTvl(tvl.data || {})), 
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
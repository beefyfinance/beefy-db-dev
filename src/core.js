const { UPDATE_INTERVAL, ERROR_INTERVAL } = require('./cfg');

const { log } = require('./log');
const { fetchApy, fetchPrice, fetchTvl } = require('./fetch');
const { connectDb, persistApy, persistPrice, persistTvl } = require('./persist');

async function init () {
  log.info(`updating data`);
  await connectDb();
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
      persistApy(apy, t),
      persistPrice(price, t),
      persistTvl(tvl, t), 
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
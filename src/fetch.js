const axios = require('axios');

const { FETCH_INTERVAL } = require('./cfg');
const { log } = require('./log');

const BASE_URL = "https://api.beefy.finance";

async function fetch () {
  try {
    const t = Math.floor(Date.now() / (60 * 60 * 1000));
    const [apy, price, tvl] = await Promise.all([
      fetchApy(t),
      fetchPrice(t),
      fetchTvl(t), 
    ]);
  
    // TODO: persist data
  
    log.debug('TVL');
    console.log(price);
    running = false;
  
    setTimeout(fetch, FETCH_INTERVAL);

  } catch (err) {
    log.error(err);
    setTimeout(fetch, ERROR_INTERVAL);
  }
}

async function fetchApy (t) {
  log.info(`fetching apy`);
  return axios.get(`${BASE_URL}/apy/breakdown?_${t}`);
}

async function fetchPrice (t) {
  log.info(`fetching price`);
  return axios.get(`${BASE_URL}/prices?_${t}`);
}

async function fetchTvl (t) {
  log.info(`fetching tvl`);
  return axios.get(`${BASE_URL}/tvl?_${t}`);
}

module.exports = {
  fetch,
  fetchApy,
  fetchPrice,
  fetchTvl,
}
const axios = require('axios');

const { log } = require('./log');

const BASE_URL = "https://api.beefy.finance";

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
  fetchApy,
  fetchPrice,
  fetchTvl,
}
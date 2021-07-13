const axios = require('axios');
const { log } = require('./log');

const BASE_URL = "https://api.beefy.finance";

async function fetchTvl () {
  log.info(`fetching tvl`);
  return axios.get(`${BASE_URL}/tvl`);
}

async function fetchApy () {
  log.info(`fetching apy`);
  return axios.get(`${BASE_URL}/apy/breakdown`);
}

async function fetchPrice () {
  log.info(`fetching price`);
  return axios.get(`${BASE_URL}/prices`);
}

module.exports = { 
  fetchTvl,
  fetchApy,
  fetchPrice
}
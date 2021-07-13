const { Client } = require('pg');

const { log } = require('./log');

let client;

async function connectDb ()  {
  log.info(`connecting database`);
  client = new Client();
  await client.connect();
  log.info(`database connected`);
}

async function persistApy (apy, t) {
  log.info(`persisting apy`);
}

async function persistPrice (price, t) {
  log.info(`persisting price`);
}

async function persistTvl (tvl, t) {
  log.info(`persisting tvl`);
}

module.exports = {
  connectDb,
  persistApy,
  persistPrice,
  persistTvl,
}
const { Pool } = require('pg');
const pgcs = require('pg-connection-string');

const { DATABASE_URL } = require('./cfg');
const { log } = require('./log');

let pool;

async function connect ()  {
  log.info(`connecting database`);

  // FIXME: self signed certs workaround
  // https://node-postgres.com/announcements#2020-02-25
  const config = pgcs.parse(DATABASE_URL);
  config.ssl = { rejectUnauthorized: false };
  pool = new Pool(config);
  
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
  connect,
  persistApy,
  persistPrice,
  persistTvl,
}
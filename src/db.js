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

// FIXME: use a migrations system (or just IPFS db)
async function migrate () {
  await pool.query(
  `CREATE TABLE IF NOT EXISTS apys (
    id SERIAL,
    t TIMESTAMP NOT NULL,
    name VARCHAR(64) NOT NULL, 
    val DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (id));
  
  CREATE TABLE IF NOT EXISTS prices (
    id SERIAL,
    t TIMESTAMP NOT NULL,
    name VARCHAR(64) NOT NULL, 
    val DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (id));
  
  CREATE TABLE IF NOT EXISTS tvls (
    id SERIAL,
    t TIMESTAMP NOT NULL,
    chain INTEGER NOT NULL,
    name VARCHAR(64) NOT NULL, 
    val DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (id));

    CREATE INDEX IF NOT EXISTS apys_t_idx ON apys (t);
    CREATE INDEX IF NOT EXISTS prices_t_idx ON prices (t);
    CREATE INDEX IF NOT EXISTS tvls_t_idx ON tvls (t);
    CREATE INDEX IF NOT EXISTS tvls_chain_idx ON tvls (chain);
  `
  )
}


async function insert (table, t, names, values) {
  log.info(`insert into ${table}`);
  // TODO: batch insert
}

async function query (table) {
  log.info(`query price`);
  // TODO: define filters
}

module.exports = {
  connect,
  migrate,
  insert,
  query,
}
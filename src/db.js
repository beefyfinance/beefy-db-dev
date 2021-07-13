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
    val DOUBLE NOT NULL,
    PRIMARY KEY (id));
  
  CREATE TABLE IF NOT EXISTS prices (
    id SERIAL,
    t TIMESTAMP NOT NULL,
    name VARCHAR(64) NOT NULL, 
    val DOUBLE NOT NULL,
    PRIMARY KEY (id));
  
  CREATE TABLE IF NOT EXISTS tvls (
    id SERIAL,
    t TIMESTAMP NOT NULL,
    name VARCHAR(64) NOT NULL, 
    val DOUBLE NOT NULL,
    PRIMARY KEY (id));

  CREATE INDEX IF NOT EXISTS ON apys (t);
  CREATE INDEX IF NOT EXISTS ON prices (t);
  CREATE INDEX IF NOT EXISTS ON tvls (t);
  `
  )
}

async function insert (table, t, names, values) {
  log.info(`insert into ${table}`);
}

async function query (table) {
  log.info(`query price`);
}

module.exports = {
  connect,
  migrate,
  insert,
  query,
}
const { Pool } = require('pg');

const { log } = require('./log');

let pool;

async function connectDb ()  {
  log.info(`connecting database`);
  pool = new Pool();
  
  pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res)
    pool.end()
  });

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
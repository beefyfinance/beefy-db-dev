const { log } = require('./log');

async function transformApy (data) {
  log.info(`transforming apy`);

  const results = [];
  for (const name in data) {
    const val = data[name].totalApy;
    if (!val) { continue; }
    results.push([name, val]);
  }

  return results;
}

async function transformPrice (data) {
  log.info(`transforming price`);
  
  const results = [];
  for (const name in data) {
    const val = data[name].totalApy;
    if (!val) { continue; }
    results.push([name, val]);
  }
  
  return results;
}

async function transformTvl (data) {
  log.info(`transforming tvl`);

  const results = [];
  for (const chain in data) {
    for (const name in data[chain]) {
      const val = data[chain][name];
      if (!val) { continue; }
      results.push([`${chain}-${name}`, val]);
    }
  }

  return [];
}

module.exports = {
  transformApy,
  transformPrice,
  transformTvl,
}
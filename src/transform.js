const { log } = require('./log');

function transformApy (data, t) {
  log.info(`transforming apy`);

  const results = [];
  for (const name in data) {
    const val = data[name].totalApy;
    if (!val) { continue; }
    results.push([t, name, val]);
  }

  return results;
}

function transformPrice (data, t) {
  log.info(`transforming price`);
  
  const results = [];
  for (const name in data) {
    const val = data[name];
    if (!val) { continue; }
    results.push([t, name, val]);
  }
  
  return results;
}

function transformTvl (data, t) {
  log.info(`transforming tvl`);

  const results = [];
  for (const chain in data) {
    for (const name in data[chain]) {
      const val = data[chain][name];
      if (!val) { continue; }
      results.push([t, `${name}-${chain}`, val]);
    }
  }

  return results;
}

module.exports = {
  transformApy,
  transformPrice,
  transformTvl,
}
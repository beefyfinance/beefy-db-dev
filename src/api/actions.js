const { log } = require('../utils/log');
const db = require('../data/db');

function buildFilter (q) {
  const filter = {}
  if (q.name) { filter.name = q.name; }
  if (q.from) { filter.from = q.from; }
  if (q.to) { filter.to = q.to; }
  return filter;
}

async function execQuery ({ ctx, table, columns }) {
  const q = ctx.request.query;
  
  const res = await db.query({
    table: table, 
    columns: columns,
    filter: buildFilter(q),
    group: q.group
  });

  return res.rows;
}

async function apy (ctx) {
  ctx.body = await execQuery({ 
    ctx,
    table: "apys",
    columns: "t, name, val",
  });
}

async function price (ctx) {
  ctx.body = await execQuery({ 
    ctx,
    table: "prices",
    columns: "t, name, val",
  });
}

async function tvl (ctx) {
  ctx.body = await execQuery({ 
    ctx,
    table: "tvls",
    columns: "t, name, val",
  });
}

module.exports = {
  apy,
  price,
  tvl
};

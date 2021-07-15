const db = require('../data/db');

// FIXME: make this dynamic. name can safely be ignored, since you always know what you are asking for
const COLUMNS = "t, name, val";

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
    columns: COLUMNS,
  });
}

async function price (ctx) {
  ctx.body = await execQuery({ 
    ctx,
    table: "prices",
    columns: COLUMNS,
  });
}

async function tvl (ctx) {
  ctx.body = await execQuery({ 
    ctx,
    table: "tvls",
    columns: COLUMNS,
  });
}

module.exports = {
  apy,
  price,
  tvl
};

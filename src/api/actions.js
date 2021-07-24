const db = require('../data/db');

// FIXME: make this dynamic. name can safely be ignored, since you always know what you are asking for
const WEEK_IN_SECS = 7 * 24 * 60 * 60;

function parseFilter (q) {
  const filter = {}
  const now = Math.floor(Date.now() / 1000);

  // TODO: defensive checks
  filter.name = q.name;
  filter.from = q.from || now - WEEK_IN_SECS;
  filter.to = q.to || now;
  filter.limit = q.limit || 30;
  filter.period = q.period || 'day';
  filter.order = q.order || 'ASC';

  return filter;
}

async function execQuery ({ ctx, table }) {
  const q = ctx.request.query;

  const res = await db.query({
    table: table,
    filter: parseFilter(q)
  });

  return res.rows;
}

async function apy (ctx) {
  ctx.body = await execQuery({ 
    ctx,
    table: "apys",
  });
}

async function price (ctx) {
  ctx.body = await execQuery({ 
    ctx,
    table: "prices",
  });
}

async function tvl (ctx) {
  ctx.body = await execQuery({ 
    ctx,
    table: "tvls",
  });
}

module.exports = {
  apy,
  price,
  tvl
};

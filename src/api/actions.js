const db = require('../data/db');

// FIXME: make this dynamic. name can safely be ignored, since you always know what you are asking for
const DAY_IN_SECS = 24 * 60 * 60;
const WEEK_IN_SECS = 7 * 24 * 60 * 60;

// FIXME: used to cap how many records we can get in bulk. 20k should be more than enough for now
const BULK_LIMIT = 20000;

function parseFilter (q) {
  const filter = {}
  const now = Math.floor(Date.now() / 1000);

  // TODO: defensive checks
  filter.name = q.name;
  filter.from = q.from || now - WEEK_IN_SECS;
  filter.to = q.to || now;
  filter.period = q.period || 'day';
  filter.order = q.order || 'ASC';
  filter.limit = q.limit || 30;

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

async function bulk (ctx) {
  const to = Math.floor(Date.now() / (DAY_IN_SECS * 1000)) * DAY_IN_SECS;
  const from = to - WEEK_IN_SECS;

  const res = await db.query({
    table: "apys",
    filter: {
      from: from,
      to: to,
      period: 'day',
      order: 'ASC',
      limit: BULK_LIMIT
    }
  });

  const group = {};
  for (let i = 0; i < res.rows.length; i++) {
    const r = res.rows[i];
    if (group[r.name]){
      group[r.name].push(r.v.toFixed(8));
    } else {
      group[r.name] = [r.v.toFixed(8)];
    }
  }
  
  ctx.body = group;
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
  bulk,
  price,
  tvl
};

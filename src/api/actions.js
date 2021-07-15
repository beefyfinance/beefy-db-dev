const { log } = require('../utils/log');

async function apy (ctx) {
  ctx.body = "apy";
}

async function price (ctx) {
  ctx.body = "price";
}

async function tvl (ctx) {
  ctx.body = "tvl";
}

module.exports = {
  apy,
  price,
  tvl
};

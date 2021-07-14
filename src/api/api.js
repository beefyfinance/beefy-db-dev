const Koa = require('koa');
const helmet = require('koa-helmet');
const cors = require('@koa/cors');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');

const rt = require('../middleware/rt');
const powered = require('../middleware/powered');
const { log } = require('../utils/log');

const router = require('./router');

let api;
function init () {
  api = new Koa();

  api.use(rt);
  api.use(conditional());
  api.use(etag());
  api.use(helmet());
  api.use(cors({ origin: '*' }));
  api.use(powered);

  api.context.cache = {};

  api.use(router.routes());
  api.use(router.allowedMethods());
}

function listen () {
  const port = process.env.PORT || 3000;
  api.listen(port);
  log.info(`beefy-db listening (:${port})`);
}

module.exports = {
  init,
  listen
}
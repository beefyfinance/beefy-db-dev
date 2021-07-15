const Koa = require('koa');
const helmet = require('koa-helmet');
const cors = require('@koa/cors');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');

const middleware = require('../middleware/middleware');
const { PORT } = require('../utils/cfg');
const { log } = require('../utils/log');

const router = require('./router');

let api;
function init () {
  api = new Koa();

  api.use(middleware.rt);
  api.use(middleware.logger);
  api.use(middleware.powered);

  api.use(conditional());
  api.use(etag());
  api.use(helmet());
  api.use(cors({ origin: '*' }));

  api.context.cache = {};

  api.use(router.routes());
  api.use(router.allowedMethods());
}

function listen () {
  api.listen(PORT);
  log.info(`beefy-db listening (:${PORT})`);
}

module.exports = {
  init,
  listen
}
const Router = require('koa-router');
const router = new Router();

const noop = require('./noop');

router.get('/', noop);

module.exports = router;

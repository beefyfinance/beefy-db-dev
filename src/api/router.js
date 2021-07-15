const Router = require('koa-router');
const router = new Router();

const actions = require('./actions'); 
const noop = require('./noop');

router.get('/apy', actions.apy);
router.get('/price', actions.price);
router.get('/tvl', actions.tvl);
router.get('/', noop);

module.exports = router;

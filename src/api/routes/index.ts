import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import apys from './apys.js';
import ranges from './ranges.js';
import tvls from './tvls.js';
import prices from './prices.js';
import clmRanges from './clmRanges.js';
import lpBreakdown from './lpbreakdown.js';
import tvlByChains from './tvlByChains.js';

export default async function (
  instance: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  instance.register(ranges, { prefix: '/ranges' });
  instance.register(apys, { prefix: '/apys' });
  instance.register(tvls, { prefix: '/tvls' });
  instance.register(prices, { prefix: '/prices' });
  instance.register(clmRanges, { prefix: '/clmRanges' });
  instance.register(lpBreakdown, { prefix: '/lpBreakdown' });
  instance.register(tvlByChains, { prefix: '/tvlByChains' });
  done();
}

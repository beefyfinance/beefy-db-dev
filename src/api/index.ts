import Fastify from 'fastify';
import FastifyHelmet from '@fastify/helmet';
import FastifyRateLimit from '@fastify/rate-limit';
import FastifyUnderPressure from '@fastify/under-pressure';
import FastifyEtag from '@fastify/etag';
import FastifyCors from '@fastify/cors';
import { NODE_ENV, API_PORT, API_CORS_ORIGIN } from '../common/config.js';
import routes from './routes/index.js';
import { logger } from './logger.js';

const server = Fastify({
  logger,
  trustProxy: true,
});

server.register(async (instance, _opts, done) => {
  instance
    .register(FastifyUnderPressure)
    .register(FastifyHelmet, { contentSecurityPolicy: NODE_ENV === 'production' })
    .register(FastifyRateLimit, {
      timeWindow: '1 minute',
      max: 100,
    })
    .register(FastifyEtag)
    .register(FastifyCors, {
      methods: ['GET'],
      origin: NODE_ENV === 'production' ? API_CORS_ORIGIN : true,
    })
    .register(routes, { prefix: '/api/v2' })
    .setErrorHandler((error, _request, reply) => {
      reply.header('cache-control', 'no-cache, no-store, must-revalidate');
      reply.send(error);
    });

  done();
});

server.listen({ port: API_PORT }, err => {
  if (err) {
    logger.error(err);
    process.exit(1);
  }
});

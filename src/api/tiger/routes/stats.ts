import type { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import S from 'fluent-json-schema';
import { getStats } from '../data/stats.js';

type StatsQueryString = {
  /** unix timestamp in seconds */
  before?: number;
  /** unix timestamp in seconds */
  after?: number;
};

const statsQueryString = S.object().prop('before', S.number()).prop('after', S.number());

const statsSchema: FastifySchema = {
  querystring: statsQueryString,
};

export default async function (
  instance: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  instance.get<{ Querystring: StatsQueryString }>(
    '/weekly',
    { schema: statsSchema },
    async (request, reply) => {
      const result = await getStats({
        before: request.query.before,
        after: request.query.after,
      });
      reply.header('cache-control', 'public, max-age=3600, stale-if-error=7200');

      return result;
    }
  );

  done();
}

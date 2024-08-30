import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import S from 'fluent-json-schema';
import { getTvlForAllChains } from '../data/tvls.js';
import { TIME_BUCKETS, TimeBucket } from '../data/timeBuckets.js';

type TvlByChainsQueryString = {
  bucket: TimeBucket;
};

const tvlByChainsQueryString = S.object().prop(
  'bucket',
  S.string().enum(Object.keys(TIME_BUCKETS)).required()
);

const tvlByChainsSchema: FastifySchema = {
  querystring: tvlByChainsQueryString,
};

export default async function (
  instance: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  instance.get<{ Querystring: TvlByChainsQueryString }>(
    '/',
    { schema: tvlByChainsSchema },
    async (request, reply) => {
      const result = await getTvlForAllChains(request.query.bucket);
      reply.header('cache-control', 'public, max-age=300, stale-if-error=3600');

      return result;
    }
  );

  done();
}

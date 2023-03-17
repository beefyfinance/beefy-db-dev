import type { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { getPrices } from '../data/prices.js';
import S from 'fluent-json-schema';
import { getOracleId, TIME_BUCKETS, TimeBucket } from '../data/common.js';

export type PricesQueryString = {
  oracle: string;
  bucket: TimeBucket;
};

const pricesQueryString = S.object()
  .prop('oracle', S.string().required())
  .prop('bucket', S.string().enum(Object.keys(TIME_BUCKETS)).required());

export const pricesSchema: FastifySchema = {
  querystring: pricesQueryString,
};

export default async function (
  instance: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  instance.get<{ Querystring: PricesQueryString }>(
    '/',
    { schema: pricesSchema },
    async (request, reply) => {
      const oracle_id = await getOracleId(request.query.oracle);
      if (!oracle_id) {
        reply.status(404);
        return { error: 'Not Found' };
      }

      const result = await getPrices(oracle_id, request.query.bucket);
      reply.header('cache-control', 'public, max-age=300, stale-if-error=3600');

      return result;
    }
  );

  done();
}

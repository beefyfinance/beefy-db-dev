import type { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { getRangePrices, getPrices } from '../data/prices.js';
import S from 'fluent-json-schema';
import { getOracleId } from '../data/common.js';
import { API_RANGE_KEY } from '../../common/config.js';
import { TIME_BUCKETS, TimeBucket } from '../data/timeBuckets.js';

export type PricesQueryString = {
  oracle: string;
  bucket: TimeBucket;
};

export type RangePricesQueryString = {
  oracle: string;
  from: number;
  to: number;
  key: string;
};

const pricesQueryString = S.object()
  .prop('oracle', S.string().required())
  .prop('bucket', S.string().enum(Object.keys(TIME_BUCKETS)).required());

const rangePricesQueryString = S.object()
  .prop('oracle', S.string().required())
  .prop('from', S.number().required())
  .prop('to', S.number().required())
  .prop('key', S.string().required());

export const pricesSchema: FastifySchema = {
  querystring: pricesQueryString,
};

export const rangePricesSchema: FastifySchema = {
  querystring: rangePricesQueryString,
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

  instance.get<{ Querystring: RangePricesQueryString }>(
    '/range',
    { schema: rangePricesSchema },
    async (request, reply) => {
      if (!request.query.key || request.query.key !== API_RANGE_KEY) {
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      const oracle_id = await getOracleId(request.query.oracle);
      if (!oracle_id) {
        reply.status(404);
        return { error: 'Not Found' };
      }

      return await getRangePrices(oracle_id, request.query.from, request.query.to);
    }
  );

  done();
}

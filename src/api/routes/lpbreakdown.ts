import type { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import S from 'fluent-json-schema';
import { getOracleId, getOracleTokens, TIME_BUCKETS, TimeBucket } from '../data/common.js';
import { API_RANGE_KEY } from '../../common/config.js';
import { getLpBreakdown, getRangeLpBreakdowns } from '../data/lpbreakdown.js';

export type LpBreakdownsQueryString = {
  oracle: string;
  bucket: TimeBucket;
};

export type RangeLpBreakdownsQueryString = {
  oracle: string;
  from: number;
  to: number;
  key: string;
};

const lpbreakdownsQueryString = S.object()
  .prop('oracle', S.string().required())
  .prop('bucket', S.string().enum(Object.keys(TIME_BUCKETS)).required());

const rangeLpBreakdownsQueryString = S.object()
  .prop('oracle', S.string().required())
  .prop('from', S.number().required())
  .prop('to', S.number().required())
  .prop('key', S.string().required());

export const lpbreakdownsSchema: FastifySchema = {
  querystring: lpbreakdownsQueryString,
};

export const rangeLpBreakdownsSchema: FastifySchema = {
  querystring: rangeLpBreakdownsQueryString,
};

export default async function (
  instance: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  instance.get<{ Querystring: LpBreakdownsQueryString }>(
    '/',
    { schema: lpbreakdownsSchema },
    async (request, reply) => {
      const oracle_id = await getOracleId(request.query.oracle);
      if (!oracle_id) {
        reply.status(404);
        return { error: 'Not Found' };
      }

      const result = await getLpBreakdown(oracle_id, request.query.bucket);
      reply.header('cache-control', 'public, max-age=300, stale-if-error=3600');

      return result;
    }
  );

  instance.get<{ Querystring: RangeLpBreakdownsQueryString }>(
    '/range',
    { schema: rangeLpBreakdownsSchema },
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

      return {
        tokens: await getOracleTokens(request.query.oracle),
        data: await getRangeLpBreakdowns(oracle_id, request.query.from, request.query.to),
      };
    }
  );

  done();
}

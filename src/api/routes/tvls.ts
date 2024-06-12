import type { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { getRangeTvls, getTvls } from '../data/tvls.js';
import S from 'fluent-json-schema';
import { getVaultId } from '../data/common.js';
import { API_RANGE_KEY } from '../../common/config.js';
import { TIME_BUCKETS, TimeBucket } from '../data/timeBuckets.js';

type TvlsQueryString = {
  vault: string;
  bucket: TimeBucket;
};

type RangeTvlsQueryString = {
  vault: string;
  from: number;
  to: number;
  key: string;
};

const tvlsQueryString = S.object()
  .prop('vault', S.string().required())
  .prop('bucket', S.string().enum(Object.keys(TIME_BUCKETS)).required());

const tvlsSchema: FastifySchema = {
  querystring: tvlsQueryString,
};

const rangeTvlsQueryString = S.object()
  .prop('vault', S.string().required())
  .prop('from', S.number().required())
  .prop('to', S.number().required())
  .prop('key', S.string().required());

const rangePricesSchema: FastifySchema = {
  querystring: rangeTvlsQueryString,
};

export default async function (
  instance: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  instance.get<{ Querystring: TvlsQueryString }>(
    '/',
    { schema: tvlsSchema },
    async (request, reply) => {
      const vault_id = await getVaultId(request.query.vault);
      if (!vault_id) {
        reply.status(404);
        return { error: 'Not Found' };
      }

      const result = await getTvls(vault_id, request.query.bucket);
      reply.header('cache-control', 'public, max-age=300, stale-if-error=3600');

      return result;
    }
  );

  instance.get<{ Querystring: RangeTvlsQueryString }>(
    '/range',
    { schema: rangePricesSchema },
    async (request, reply) => {
      if (!request.query.key || request.query.key !== API_RANGE_KEY) {
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      const vault_id = await getVaultId(request.query.vault);
      if (!vault_id) {
        reply.status(404);
        return { error: 'Not Found' };
      }

      const result = await getRangeTvls(vault_id, request.query.from, request.query.to);
      reply.header('cache-control', 'public, max-age=300, stale-if-error=3600');

      return result;
    }
  );

  done();
}

import type { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { getTvls } from '../data/tvls.js';
import S from 'fluent-json-schema';
import { getVaultId, TIME_BUCKETS, TimeBucket } from '../data/common.js';

export type TvlsQueryString = {
  vault: string;
  bucket: TimeBucket;
};

const tvlsQueryString = S.object()
  .prop('vault', S.string().required())
  .prop('bucket', S.string().enum(Object.keys(TIME_BUCKETS)).required());

export const tvlsSchema: FastifySchema = {
  querystring: tvlsQueryString,
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

  done();
}

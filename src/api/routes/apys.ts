import type { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { getApys } from '../data/apys.js';
import S from 'fluent-json-schema';
import { getVaultId, TIME_BUCKETS, TimeBucket } from '../data/common.js';

export type ApysQueryString = {
  vault: string;
  bucket: TimeBucket;
};

const apysQueryString = S.object()
  .prop('vault', S.string().required())
  .prop('bucket', S.string().enum(Object.keys(TIME_BUCKETS)).required());

export const apysSchema: FastifySchema = {
  querystring: apysQueryString,
};

export default async function (
  instance: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  instance.get<{ Querystring: ApysQueryString }>(
    '/',
    { schema: apysSchema },
    async (request, reply) => {
      const vault_id = await getVaultId(request.query.vault);
      if (!vault_id) {
        reply.status(404);
        return { error: 'Not Found' };
      }

      const result = await getApys(vault_id, request.query.bucket);
      reply.header('cache-control', 'public, max-age=300, stale-if-error=3600');

      return result;
    }
  );

  done();
}

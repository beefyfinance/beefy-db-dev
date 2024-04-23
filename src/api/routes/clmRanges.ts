import type { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import S from 'fluent-json-schema';
import { TIME_BUCKETS, TimeBucket } from '../data/common.js';
import { getClmRanges } from '../data/clmRanges.js';

export type ApysQueryString = {
  vaultAddress: string;
  chain: string;
  bucket: TimeBucket;
};

const apysQueryString = S.object()
  .prop('vaultAddress', S.string().required())
  .prop('chain', S.string().required())
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
      const result = await getClmRanges(
        request.query.vaultAddress,
        request.query.chain,
        request.query.bucket
      );

      if (!result) {
        reply.status(404);
        return { error: 'Not Found' };
      }

      reply.header('cache-control', 'public, max-age=300, stale-if-error=3600');

      return result;
    }
  );

  done();
}

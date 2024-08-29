import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import S from 'fluent-json-schema';
import { getChainId } from '../data/common.js';
import { getChainTvls } from '../data/tvls.js';
import { TIME_BUCKETS, TimeBucket } from '../data/timeBuckets.js';

type TvlByChainQueryString = {
  chain: string;
  bucket: TimeBucket;
};

const tvlByChainQueryString = S.object()
  .prop('chain', S.string().required())
  .prop('bucket', S.string().enum(Object.keys(TIME_BUCKETS)).required());

const tvlByChainSchema: FastifySchema = {
  querystring: tvlByChainQueryString,
};

export default async function (
  instance: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  instance.get<{ Querystring: TvlByChainQueryString }>(
    '/',
    { schema: tvlByChainSchema },
    async (request, reply) => {
      const chain_id = await getChainId(request.query.chain.toLocaleLowerCase());
      if (!chain_id) {
        reply.status(404);
        return { error: `${request.query.chain} Not Found` };
      }

      const result = await getChainTvls(chain_id, request.query.bucket);
      reply.header('cache-control', 'public, max-age=300, stale-if-error=3600');

      return result;
    }
  );

  done();
}

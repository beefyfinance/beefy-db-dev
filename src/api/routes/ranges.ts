import type { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import S from 'fluent-json-schema';
import { getRanges } from '../data/ranges.js';

export type RangeQueryString = {
  vault: string;
  oracle: string;
};

const rangeQueryString = S.object()
  .prop('vault', S.string().required())
  .prop('oracle', S.string().required());

export const rangeSchema: FastifySchema = {
  querystring: rangeQueryString,
};

export default async function (
  instance: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  instance.get<{ Querystring: RangeQueryString }>(
    '/',
    { schema: rangeSchema },
    async (request, reply) => {
      const result = getRanges(request.query.vault, request.query.oracle);

      reply.header('cache-control', 'public, max-age=300, stale-if-error=3600');

      return result;
    }
  );

  done();
}

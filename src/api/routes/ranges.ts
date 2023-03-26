import type { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import S from 'fluent-json-schema';
import { getRanges } from '../data/ranges.js';
import { getOracleId, getVaultId } from '../data/common.js';

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
      const vaultId = await getVaultId(request.query.vault);
      const oracleId = await getOracleId(request.query.oracle);
      if (!vaultId || !oracleId) {
        reply.status(404);
        return { error: 'Not Found' };
      }

      const result = getRanges(vaultId, oracleId);

      reply.header('cache-control', 'public, max-age=300, stale-if-error=3600');

      return result;
    }
  );

  done();
}

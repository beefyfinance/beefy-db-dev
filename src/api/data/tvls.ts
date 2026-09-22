import { getPool, unixToTimestamp } from '../../common/db.js';
import { type DataPoint, getEntries } from './common.js';
import { getSnapshotAlignedBucketParams, TimeBucket } from './timeBuckets.js';
import { invert } from 'lodash-es';
import { getChainIds } from '../../snapshot/ids.js';

export async function getTvls(vault_id: number, bucket: TimeBucket): Promise<DataPoint[]> {
  return getEntries('tvls', 'vault_id', vault_id, bucket);
}

export async function getRangeTvls(
  vault_id: number,
  from: number,
  to: number
): Promise<DataPoint[]> {
  const pool = getPool();

  const query = `SELECT EXTRACT(EPOCH FROM t)::integer as t, val as v
                 FROM tvls
                 WHERE vault_id = $1
                   AND t BETWEEN $2 AND $3
                 ORDER BY t ASC`;
  const params = [vault_id, unixToTimestamp(from), unixToTimestamp(to)];

  const result = await pool.query(query, params);

  return result.rows;
}

interface TvlByChainDataPoint {
  t: number;
  total: number;
  clm: number;
  vault: number;
  gov: number;
}

export async function getTvlForChain(
  chain_id: number,
  bucket: TimeBucket
): Promise<TvlByChainDataPoint[]> {
  const { bin, startTimestamp, endTimestamp } = getSnapshotAlignedBucketParams(bucket);
  const pool = getPool();

  const query = `SELECT EXTRACT(EPOCH FROM date_bin($4, t, $2))::integer as t,
                        max(total)                                       as total,
                        max(vault)                                       as vault,
                        max(gov)                                         as gov,
                        max(clm)                                         as clm
                 FROM tvl_by_chain
                 WHERE chain_id = $1
                   AND t BETWEEN $2 AND $3
                 GROUP BY date_bin($4, t, $2)
                 ORDER BY t ASC`;

  const params = [chain_id, startTimestamp, endTimestamp, bin];

  const result = await pool.query(query, params);

  return result.rows;
}

const tvlByChainsDataPointFields = ['t', 'total', 'vault', 'gov', 'clm'] as const;
type TvlByChainsDataPoint = number[];
type TvlByChainsResponse = {
  fields: typeof tvlByChainsDataPointFields;
  data: Record<string, TvlByChainsDataPoint[]>;
};

export async function getTvlForAllChains(bucket: TimeBucket): Promise<TvlByChainsResponse> {
  const { bin, startTimestamp, endTimestamp } = getSnapshotAlignedBucketParams(bucket);
  const pool = getPool();

  const query = `SELECT chain_id,
                        EXTRACT(EPOCH FROM date_bin($3, t, $1))::integer as t,
                        max(total)                                       as total,
                        max(vault)                                       as vault,
                        max(gov)                                         as gov,
                        max(clm)                                         as clm
                 FROM tvl_by_chain
                 WHERE t BETWEEN $1 AND $2
                 GROUP BY chain_id, date_bin($3, t, $1)
                 ORDER BY t ASC`;

  const params = [startTimestamp, endTimestamp, bin];

  const result = await pool.query(query, params);
  const chains = invert(await getChainIds());

  return {
    fields: tvlByChainsDataPointFields,
    data: result.rows.reduce(
      (
        acc: Record<string, TvlByChainsDataPoint[]>,
        row: TvlByChainDataPoint & { chain_id: number }
      ) => {
        const chain = chains[row.chain_id] || row.chain_id;
        const chainRows = (acc[chain] ??= []);
        chainRows.push(tvlByChainsDataPointFields.map(k => row[k] || 0));
        return acc;
      },
      {} as Record<string, TvlByChainsDataPoint[]>
    ),
  };
}

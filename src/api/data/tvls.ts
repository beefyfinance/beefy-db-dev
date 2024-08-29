import { getPool, unixToTimestamp } from '../../common/db.js';
import { logger } from '../logger.js';
import type { DataPoint } from './common.js';
import { debugQueryToString, getEntries } from './common.js';
import { getSnapshotAlignedBucketParams, TimeBucket } from './timeBuckets.js';

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
  total_tvl: number;
  clm_tvl: number;
  vaults_tvl: number;
  gov_tvl: number;
}

export async function getChainTvls(
  chain_id: number,
  bucket: TimeBucket
): Promise<TvlByChainDataPoint[]> {
  const { bin, startTimestamp, endTimestamp } = getSnapshotAlignedBucketParams(bucket);
  const pool = getPool();

  const query = `SELECT EXTRACT(EPOCH FROM date_bin($4, t, $2))::integer as t,
                        max(total_tvl)                           as total_tvl,
                        max(clm_tvl)                               as clm_tvl,
                        max(vault_tvl)                           as vault_tvl,
                        max(gov_tvl)                                as gov_tvl
                 FROM tvl_by_chain
                 WHERE chain_id = $1
                   AND t BETWEEN $2 AND $3
                 GROUP BY date_bin($4, t, $2)
                 ORDER BY t ASC`;

  const params = [chain_id, startTimestamp, endTimestamp, bin];

  logger.trace(debugQueryToString(query, params));
  const result = await pool.query(query, params);

  return result.rows;
}

import { getPool } from '../../common/db.js';
import { getSnapshotAlignedBucketParams, TimeBucket } from './timeBuckets.js';

export type Table = 'prices' | 'apys' | 'tvls' | 'lp_breakdowns' | 'tvl_by_chain' | 'apys_agg_mv';
export type IdColumn = 'oracle_id' | 'vault_id' | 'chain_id';

export type DataPoint = {
  t: number;
  v: number;
};

export function debugQueryToString(query: string, params: (string | number)[]) {
  let out = query;
  for (let i = 0; i < params.length; ++i) {
    out = out.replaceAll('$' + (i + 1), `'${params[i]}'`);
  }
  return out;
}

export async function getEntries(
  table: Table,
  column: IdColumn,
  id: number,
  bucket: TimeBucket
): Promise<DataPoint[]> {
  const { bin, startTimestamp, endTimestamp } = getSnapshotAlignedBucketParams(bucket);
  const pool = getPool();

  const query = `SELECT EXTRACT(EPOCH FROM date_bin($4, t, $2))::integer as t,
                        avg(val::numeric):: double precision                                         as v
                 FROM ${table}
                 WHERE ${column} = $1
                   AND t BETWEEN $2 AND $3
                 GROUP BY date_bin($4, t, $2)
                 ORDER BY t ASC`;
  const params = [id, startTimestamp, endTimestamp, bin];

  const result = await pool.query(query, params);

  return result.rows;
}

export async function getOracleId(oracle: string): Promise<number | undefined> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id
     FROM price_oracles
     WHERE oracle_id = $1
     LIMIT 1`,
    [oracle]
  );

  return result.rows[0]?.id;
}

export async function getOracleTokens(oracle: string): Promise<number | undefined> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT tokens
     FROM price_oracles
     WHERE oracle_id = $1
     LIMIT 1`,
    [oracle]
  );

  return result.rows[0]?.tokens || [];
}

export async function getVaultId(vault: string): Promise<number | undefined> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id
     FROM vault_ids
     WHERE vault_id = $1
     LIMIT 1`,
    [vault]
  );

  return result.rows[0]?.id;
}

export async function getChainId(chain: string): Promise<number | undefined> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id
     FROM chain_ids
     WHERE chain_id = $1
     LIMIT 1`,
    [chain]
  );

  return result.rows[0]?.id;
}

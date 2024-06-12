import { getPool, unixToTimestamp } from '../../common/db.js';
import { DataPoint, debugQueryToString, IdColumn, Table } from './common.js';
import { logger } from '../logger.js';
import { getSnapshotAlignedBucketParams, TimeBucket } from './timeBuckets.js';

export async function getLpBreakdown(oracle_id: number, bucket: TimeBucket): Promise<DataPoint[]> {
  return getLpBreakdownEntries('lp_breakdowns', 'oracle_id', oracle_id, bucket);
}

export async function getLpBreakdownEntries(
  table: Table,
  column: IdColumn,
  id: number,
  bucket: TimeBucket
): Promise<DataPoint[]> {
  const { bin, startTimestamp, endTimestamp } = getSnapshotAlignedBucketParams(bucket);
  const pool = getPool();

  const query = `SELECT EXTRACT(EPOCH FROM date_bin($4, t, $2))::integer as t,
                        max(balances)                                    as b,
                        max(total_supply)                                as s
                 FROM ${table}
                 WHERE ${column} = $1
                   AND t BETWEEN $2 AND $3
                 GROUP BY date_bin($4, t, $2)
                 ORDER BY t ASC`;
  const params = [id, startTimestamp, endTimestamp, bin];

  logger.trace(debugQueryToString(query, params));
  const result = await pool.query(query, params);

  return result.rows;
}

export async function getRangeLpBreakdowns(
  oracle_id: number,
  from: number,
  to: number
): Promise<DataPoint[]> {
  const pool = getPool();

  const query = `SELECT EXTRACT(EPOCH FROM t)::integer as t, balances as b, total_supply as s
                 FROM lp_breakdowns
                 WHERE oracle_id = $1
                   AND t BETWEEN $2 AND $3
                 ORDER BY t ASC`;
  const params = [oracle_id, unixToTimestamp(from), unixToTimestamp(to)];

  const result = await pool.query(query, params);

  return result.rows;
}

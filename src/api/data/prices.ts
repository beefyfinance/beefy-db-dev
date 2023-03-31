import type { DataPoint, TimeBucket } from './common.js';
import { getEntries } from './common.js';
import { getPool, unixToTimestamp } from '../../common/db.js';

export async function getPrices(oracle_id: number, bucket: TimeBucket): Promise<DataPoint[]> {
  return getEntries('prices', 'oracle_id', oracle_id, bucket);
}

export async function getRangePrices(
  oracle_id: number,
  from: number,
  to: number
): Promise<DataPoint[]> {
  const pool = getPool();

  const query = `SELECT EXTRACT(EPOCH FROM t)::integer as t, val as v
                 FROM prices
                 WHERE oracle_id = $1
                   AND t BETWEEN $2 AND $3
                 ORDER BY t ASC`;
  const params = [oracle_id, unixToTimestamp(from), unixToTimestamp(to)];

  const result = await pool.query(query, params);

  return result.rows;
}

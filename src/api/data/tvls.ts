import { getPool, unixToTimestamp } from '../../common/db.js';
import type { DataPoint } from './common.js';
import { getEntries } from './common.js';
import { TimeBucket } from './timeBuckets.js';

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

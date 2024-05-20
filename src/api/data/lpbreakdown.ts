import { getPool, unixToTimestamp } from '../../common/db.js';
import type { DataPoint, TimeBucket } from './common.js';
import { getEntries } from './common.js';

export async function getLpBreakdown(oracle_id: number, bucket: TimeBucket): Promise<DataPoint[]> {
  return getEntries('lp_breakdowns', 'oracle_id', oracle_id, bucket);
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

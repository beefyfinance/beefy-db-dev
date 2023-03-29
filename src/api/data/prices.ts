import type { DataPoint, TimeBucket } from './common.js';
import { getEntries } from './common.js';
import { getPool } from '../../common/db.js';
import { format, fromUnixTime } from 'date-fns';

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
  const params = [oracle_id, format(fromUnixTime(from), 'yyyy-MM-dd HH:mm:ssxx'), format(fromUnixTime(to), 'yyyy-MM-dd HH:mm:ssxx')];

  const result = await pool.query(query, params);

  return result.rows;
}

import type { DataPoint, TimeBucket } from './common.js';
import { getEntries } from './common.js';
import { getPool } from '../../common/db.js';

export async function getPrices(oracle_id: number, bucket: TimeBucket): Promise<DataPoint[]> {
  return getEntries('prices', 'oracle_id', oracle_id, bucket);
}

export async function getBulkPrices(
  oracle_id: number,
  from: number,
  to: number
): Promise<DataPoint[]> {
  const pool = getPool();

  const query = `SELECT t::int, val as v
                 FROM prices
                 WHERE oracle_id = $1
                   AND t BETWEEN $2 AND $3
                 ORDER BY t ASC`;
  const params = [oracle_id, from, to];

  const result = await pool.query(query, params);

  return result.rows;
}

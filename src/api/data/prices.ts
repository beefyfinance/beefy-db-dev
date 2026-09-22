import type { DataPoint } from './common.js';
import { getEntries } from './common.js';
import { queryWithScanOverrides } from './planOverrides.js';
import { unixToTimestamp } from '../../common/db.js';
import { TimeBucket } from './timeBuckets.js';

export async function getPrices(oracle_id: number, bucket: TimeBucket): Promise<DataPoint[]> {
  return getEntries('prices', 'oracle_id', oracle_id, bucket);
}

export async function getRangePrices(
  oracle_id: number,
  from: number,
  to: number
): Promise<DataPoint[]> {
  const query = `SELECT EXTRACT(EPOCH FROM t)::integer as t, val as v
                 FROM prices
                 WHERE oracle_id = $1
                   AND t BETWEEN $2 AND $3
                 ORDER BY t ASC`;
  const params = [oracle_id, unixToTimestamp(from), unixToTimestamp(to)];

  return queryWithScanOverrides<DataPoint>(query, params);
}

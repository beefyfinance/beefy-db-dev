import { getPool } from '../../common/db.js';
import type { DataPoint } from './common.js';
import { getEntries } from './common.js';
import { TimeBucket } from './timeBuckets.js';

export async function getApys(vault_id: number, bucket: TimeBucket): Promise<DataPoint[]> {
  return getEntries('apys', 'vault_id', vault_id, bucket);
}

export async function getAvgApys(): Promise<DataPoint[]> {
  const pool = getPool();
  const query = `SELECT v.vault_id AS vault_id,
                      a.avg_7d,
                      a.avg_30d,
                      a.avg_90d
                FROM apys_agg_mv AS a
                JOIN vault_ids AS v
                  ON a.vault_id = v.id
                LIMIT ALL`;
  const result = await pool.query(query);
  return result.rows;
}

import type { DataPoint } from './common.js';
import { getAllEntries, getEntries } from './common.js';
import { TimeBucket } from './timeBuckets.js';

export async function getApys(vault_id: number, bucket: TimeBucket): Promise<DataPoint[]> {
  return getEntries('apys', 'vault_id', vault_id, bucket);
}

export async function getAvgApys(): Promise<DataPoint[]> {
  return getAllEntries('apys_agg_mv');
}

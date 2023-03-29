import type { DataPoint, TimeBucket } from './common.js';
import { getEntries } from './common.js';

export async function getApys(vault_id: number, bucket: TimeBucket): Promise<DataPoint[]> {
  return getEntries('apys', 'vault_id', vault_id, bucket);
}

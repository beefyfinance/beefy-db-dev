import type { DataPoint, TimeBucket } from './common.js';
import { getEntries } from './common.js';

export async function getTvls(vault_id: number, bucket: TimeBucket): Promise<DataPoint[]> {
  return getEntries('tvls', 'vault_id', vault_id, bucket);
}

import type { HLOC, TimeBucket } from './common.js';
import { getEntries } from './common.js';

export async function getApys(vault_id: number, bucket: TimeBucket): Promise<HLOC[]> {
  return getEntries('apys', 'vault_id', vault_id, bucket);
}

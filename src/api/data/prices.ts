import type { HLOC, TimeBucket } from './common.js';
import { getEntries } from './common.js';

export async function getPrices(oracle_id: number, bucket: TimeBucket): Promise<HLOC[]> {
  return getEntries('prices', 'oracle_id', oracle_id, bucket);
}

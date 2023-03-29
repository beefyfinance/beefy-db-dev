import { SNAPSHOT_INTERVAL } from '../common/config.js';
import { getQueryBuilder } from '../common/db.js';

export async function getLastSnapshot() {
  const builder = await getQueryBuilder();
  const result = await builder.table('prices').max('t');

  if (!result || result.length !== 1 || !result[0] || !('max' in result[0])) {
    throw new Error('Could not get last snapshot');
  }

  return result[0]['max'].getTime()/1000;
}

export function getNextSnapshot() {
  return Math.floor(Date.now() / (SNAPSHOT_INTERVAL * 1000)) * SNAPSHOT_INTERVAL;
}

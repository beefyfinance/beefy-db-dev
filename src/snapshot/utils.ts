import { SNAPSHOT_INTERVAL } from '../common/config.js';
import { getPool } from '../common/db.js';
import type { TupleToObject } from './type-utils.js';

export async function getLastSnapshot() {
  // Every table gets its rows in the same transaction, so the smallest one answers for all of them. The time
  // bound keeps the scan to the newest chunks: there is no index on t alone.
  const result = await getPool().query<{ max: Date | null }>(
    `SELECT max(t) AS max
     FROM tvl_by_chain
     WHERE t > now() - INTERVAL '7 days'`
  );

  // nothing in the last week, or an empty db: a snapshot is due either way
  const max = result.rows[0]?.max;
  if (!max) {
    return 0;
  }

  return max.getTime() / 1000;
}

export function getNextSnapshot() {
  return Math.floor(Date.now() / (SNAPSHOT_INTERVAL * 1000)) * SNAPSHOT_INTERVAL;
}

export function fromArray<TKeyTuple extends readonly string[], TValue>(
  keys: TKeyTuple,
  valueFn: (key: TKeyTuple[number]) => TValue
): TupleToObject<TKeyTuple, TValue> {
  return Object.fromEntries(keys.map(key => [key, valueFn(key)])) as TupleToObject<
    TKeyTuple,
    TValue
  >;
}

export function getOrThrow<K extends string, T extends Record<K, any>>(obj: T, key: K): T[K] {
  const value = obj[key];
  if (value === undefined) {
    throw new Error(`Missing key ${key}`);
  }

  return value;
}

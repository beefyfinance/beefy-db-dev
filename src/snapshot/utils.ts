import { SNAPSHOT_INTERVAL } from '../common/config.js';
import { getQueryBuilder } from '../common/db.js';
import type { TupleToObject } from './type-utils.js';

export async function getLastSnapshot() {
  const builder = await getQueryBuilder();
  const result = await builder.table('prices').max('t');

  if (!result || result.length !== 1 || !result[0] || !('max' in result[0])) {
    throw new Error('Could not get last snapshot');
  }

  // db is empty
  if (!result[0]['max']) {
    return 0;
  }

  return result[0]['max'].getTime() / 1000;
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

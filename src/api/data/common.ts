import { dateToTimestamp, getPool } from '../../common/db.js';
import { getNextSnapshot } from '../../snapshot/utils.js';
import { fromUnixTime, sub } from 'date-fns';
import { SNAPSHOT_INTERVAL } from '../../common/config.js';
import { logger } from '../logger.js';

export const TIME_BUCKETS = {
  '1h_1d': { bin: '1 hour', range: { days: 1 }, maPeriod: { hours: 6 }, duration: 60 * 60 },
  '1h_1w': { bin: '1 hour', range: { days: 7 }, maPeriod: { hours: 48 }, duration: 60 * 60 },
  '1h_1M': { bin: '1 hour', range: { days: 30 }, maPeriod: { hours: 96 }, duration: 60 * 60 },
  '1d_1M': { bin: '1 day', range: { months: 1 }, maPeriod: { days: 10 }, duration: 60 * 60 * 24 },
  '1d_1Y': { bin: '1 day', range: { years: 1 }, maPeriod: { days: 30 }, duration: 60 * 60 * 24 },
};

export type TimeBucket = keyof typeof TIME_BUCKETS;

export type Table = 'prices' | 'apys' | 'tvls' | 'lp_breakdowns';
export type IdColumn = 'oracle_id' | 'vault_id';

export type DataPoint = {
  t: number;
  v: number;
};

export function getBucketParams(bucket: TimeBucket) {
  const { bin, range, maPeriod } = TIME_BUCKETS[bucket];
  const nextSnapshotEpoch = getNextSnapshot();
  const endDate = fromUnixTime(nextSnapshotEpoch - SNAPSHOT_INTERVAL);
  const startDate = sub(sub(endDate, range), maPeriod); // extra range for moving average
  const startTimestamp = dateToTimestamp(startDate);
  const endTimestamp = dateToTimestamp(endDate);
  return { bin, startTimestamp, endTimestamp };
}

export function getBucketDurationAndPeriod(bucket: TimeBucket) {
  const { bin, range, maPeriod, duration } = TIME_BUCKETS[bucket];
  const endDate = Date.now();
  const startDate = Math.floor(sub(sub(endDate, range), maPeriod).getTime() / 1000); // extra range for moving average
  const [periodKey, rangeKey] = bucket.split('_') as [string, string];
  return { bin, startDate, duration, periodKey, rangeKey };
}

export function debugQueryToString(query: string, params: (string | number)[]) {
  let out = query;
  for (let i = 0; i < params.length; ++i) {
    out = out.replaceAll('$' + (i + 1), `'${params[i]}'`);
  }
  return out;
}

export async function getEntries(
  table: Table,
  column: IdColumn,
  id: number,
  bucket: TimeBucket
): Promise<DataPoint[]> {
  const { bin, startTimestamp, endTimestamp } = getBucketParams(bucket);
  const pool = getPool();

  const query = `SELECT EXTRACT(EPOCH FROM date_bin($4, t, $2))::integer as t,
                        max(val)                                         as v
                 FROM ${table}
                 WHERE ${column} = $1
                   AND t BETWEEN $2 AND $3
                 GROUP BY date_bin($4, t, $2)
                 ORDER BY t ASC`;
  const params = [id, startTimestamp, endTimestamp, bin];

  logger.trace(debugQueryToString(query, params));
  const result = await pool.query(query, params);

  return result.rows;
}

export async function getOracleId(oracle: string): Promise<number | undefined> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id
     FROM price_oracles
     WHERE oracle_id = $1
     LIMIT 1`,
    [oracle]
  );

  return result.rows[0]?.id;
}

export async function getOracleTokens(oracle: string): Promise<number | undefined> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT tokens
     FROM price_oracles
     WHERE oracle_id = $1
     LIMIT 1`,
    [oracle]
  );

  return result.rows[0]?.tokens || [];
}

export async function getVaultId(vault: string): Promise<number | undefined> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id
     FROM vault_ids
     WHERE vault_id = $1
     LIMIT 1`,
    [vault]
  );

  return result.rows[0]?.id;
}

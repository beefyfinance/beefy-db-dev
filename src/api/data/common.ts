import { getPool } from '../../common/db.js';
import { getNextSnapshot } from '../../snapshot/utils.js';
import { format, fromUnixTime, getUnixTime, sub } from 'date-fns';
import { SNAPSHOT_INTERVAL } from '../../common/config.js';

export const TIME_BUCKETS = {
  '1h_1d': { bin: '1 hour', range: { days: 1 }, maPeriod: { hours: 6 } },
  '1h_1w': { bin: '1 hour', range: { days: 7 }, maPeriod: { hours: 48 } },
  '1d_1M': { bin: '1 day', range: { months: 1 }, maPeriod: { days: 10 } },
  '1d_1Y': { bin: '1 day', range: { years: 1 }, maPeriod: { days: 30 } },
};

export type TimeBucket = keyof typeof TIME_BUCKETS;

export type Table = 'prices' | 'apys' | 'tvls';
export type IdColumn = 'oracle_id' | 'vault_id';

export type HLOC = {
  t: number;
  h: number;
  l: number;
  o: number;
  c: number;
};

export function getBucketParams(bucket: TimeBucket) {
  const { bin, range, maPeriod } = TIME_BUCKETS[bucket];
  const nextSnapshotEpoch = getNextSnapshot();
  const endDate = fromUnixTime(nextSnapshotEpoch - SNAPSHOT_INTERVAL);
  const startDate = sub(sub(endDate, range), maPeriod); // extra range for moving average
  const endEpoch = getUnixTime(endDate);
  const startEpoch = getUnixTime(startDate);
  const startTimestamp = format(startDate, 'yyyy-MM-dd HH:mm:ssx');
  return { bin, endEpoch, startEpoch, startTimestamp };
}

export async function getEntries(
  table: Table,
  column: IdColumn,
  id: number,
  bucket: TimeBucket
): Promise<HLOC[]> {
  const { bin, endEpoch, startEpoch, startTimestamp } = getBucketParams(bucket);
  const pool = getPool();

  // note: 'close' is actually the last value in the bin, traditionally it would be the same as first 'open' in the next bin
  const result = await pool.query(
    `SELECT EXTRACT(EPOCH FROM date_bin($5, to_timestamp(t), $2::timestamp))::integer as t,
            max(val)                                                                  as h,
            min(val)                                                                  as l,
            (array_agg(val ORDER BY t ASC))[1]                                           o,
            (array_agg(val ORDER BY t DESC))[1]                                          c
     FROM ${table}
     WHERE ${column} = $1
       AND t BETWEEN $3 AND $4
     GROUP BY date_bin($5, to_timestamp(t), $2::timestamp)
     ORDER BY t ASC`,
    [id, startTimestamp, startEpoch, endEpoch, bin]
  );

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

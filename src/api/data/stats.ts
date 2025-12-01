import { getPool, unixToTimestamp } from '../../common/db.js';
import { Pool } from 'pg';

type StatsOptions = {
  /** unix timestamp in seconds */
  before?: number | undefined;
  /** unix timestamp in seconds */
  after?: number | undefined;
};

type StatsRow = {
  t: number;
  harvests_total_usd: number;
  buyback_amount?: number | null;
  buyback_avg_price?: number | null;
  buyback_total_usd?: number | null;
  fees_platform_usd?: number | null;
  fees_treasury_usd?: number | null;
  fees_pool_native?: number | null;
};

const selectColumns = [
  'EXTRACT(EPOCH FROM week)::integer AS t',
  'harvests_total_usd',
  'buyback_amount',
  'buyback_avg_price',
  'buyback_total_usd',
  'fees_platform_usd',
  'fees_treasury_usd',
  'fees_pool_native',
].join(', ');

export async function getStats({ before, after }: StatsOptions) {
  const pool = getPool();
  const query =
    before && after
      ? getStatsBetween(pool, after, before)
      : before
      ? getStatsBefore(pool, before)
      : after
      ? getStatsAfter(pool, after)
      : getAllStats(pool);
  return query.then(res => res.rows);
}

async function getStatsBetween(pool: Pool, after: number, before: number) {
  return pool.query<StatsRow>(
    `SELECT ${selectColumns}
     FROM stats_weekly
     WHERE week BETWEEN $1 AND $2
     ORDER BY week DESC`,
    [unixToTimestamp(after), unixToTimestamp(before)]
  );
}

async function getStatsBefore(pool: Pool, before: number) {
  return pool.query<StatsRow>(
    `SELECT ${selectColumns}
     FROM stats_weekly
     WHERE week <= $1
     ORDER BY week DESC`,
    [unixToTimestamp(before)]
  );
}

async function getStatsAfter(pool: Pool, after: number) {
  return pool.query<StatsRow>(
    `SELECT ${selectColumns}
     FROM stats_weekly
     WHERE week >= $1
     ORDER BY week DESC`,
    [unixToTimestamp(after)]
  );
}

async function getAllStats(pool: Pool) {
  return pool.query<StatsRow>(
    `SELECT ${selectColumns}
     FROM stats_weekly
     ORDER BY week DESC`
  );
}

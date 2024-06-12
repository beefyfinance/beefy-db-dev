import { fromUnixTime, getUnixTime, isAfter, sub } from 'date-fns';
import { getNextSnapshot } from '../../snapshot/utils.js';
import { SNAPSHOT_INTERVAL } from '../../common/config.js';
import { dateToTimestamp } from '../../common/db.js';

type BucketSize = {
  /** size of bucket in seconds */
  size: number;
  /** postgres date_bin stride parameter */
  bin: string;
};
const BUCKET_SIZES = {
  '1h': { bin: '1 hour', size: 60 * 60 },
  '1d': { bin: '1 day', size: 60 * 60 * 24 },
} as const satisfies Record<string, BucketSize>;
type TimeBucketSizes = typeof BUCKET_SIZES;
type TimeBucketSize = keyof TimeBucketSizes;

type BucketRange = {
  /** length of range in date-fns Duration format */
  range: Duration;
  /** length of moving average period in date-fns Duration format */
  maPeriod: Duration;
};
const BUCKET_RANGE = {
  '1d': { range: { days: 1 }, maPeriod: { hours: 6 } },
  '1w': { range: { days: 7 }, maPeriod: { hours: 48 } },
  '1M': { range: { days: 30 }, maPeriod: { hours: 96 } },
  '1Y': { range: { years: 1 }, maPeriod: { days: 30 } },
  all: { range: { years: 10 }, maPeriod: { days: 0 } },
} as const satisfies Record<string, BucketRange>;
type TimeBucketRanges = typeof BUCKET_RANGE;
type TimeBucketRange = keyof TimeBucketRanges;

type SizeRangeToBucket<S extends TimeBucketSize, R extends TimeBucketRange> = TimeBucketSizes[S] &
  TimeBucketRanges[R] & {
    sizeKey: S;
    rangeKey: R;
  };
type PossibleTimeBuckets = `${TimeBucketSize}_${TimeBucketRange}`;
type ValidTimeBuckets = {
  [K in PossibleTimeBuckets]?: K extends `${infer S}_${infer R}`
    ? S extends TimeBucketSize
      ? R extends TimeBucketRange
        ? SizeRangeToBucket<S, R>
        : never
      : never
    : never;
};

function makeTimeBucket<S extends TimeBucketSize, R extends TimeBucketRange>(
  size: S,
  range: R
): SizeRangeToBucket<S, R> {
  return {
    ...BUCKET_SIZES[size],
    ...BUCKET_RANGE[range],
    sizeKey: size,
    rangeKey: range,
  };
}

export const TIME_BUCKETS = {
  '1h_1d': makeTimeBucket('1h', '1d'),
  '1h_1w': makeTimeBucket('1h', '1w'),
  '1h_1M': makeTimeBucket('1h', '1M'),
  '1d_1M': makeTimeBucket('1d', '1M'),
  '1d_1Y': makeTimeBucket('1d', '1Y'),
  '1d_all': makeTimeBucket('1d', 'all'),
} as const satisfies ValidTimeBuckets;

type TimeBucketMap = typeof TIME_BUCKETS;
export type TimeBucket = keyof TimeBucketMap;

export type TimeBucketParams<T extends TimeBucket> = TimeBucketMap[T] & {
  startDate: Date;
  endDate: Date;
  /** postgres TIMESTAMP WITH TIME ZONE */
  startTimestamp: string;
  /** postgres TIMESTAMP WITH TIME ZONE */
  endTimestamp: string;
  /** seconds since unix epoch */
  startUnix: number;
  /** seconds since unix epoch */
  endUnix: number;
};

function getBucket<T extends TimeBucket>(bucketKey: T): TimeBucketMap[T] {
  return TIME_BUCKETS[bucketKey];
}

export function getSnapshotAlignedBucketParams<T extends TimeBucket>(
  bucketKey: T
): TimeBucketParams<T> {
  const nextSnapshotEpoch = getNextSnapshot();
  const nextSnapshot = fromUnixTime(nextSnapshotEpoch);
  const now = new Date();
  const endDate = isAfter(nextSnapshot, now)
    ? fromUnixTime(nextSnapshotEpoch - SNAPSHOT_INTERVAL)
    : nextSnapshot;
  return getBucketParams(bucketKey, endDate);
}

export function getBucketParams<T extends TimeBucket>(
  bucketKey: T,
  endDate?: Date | undefined
): TimeBucketParams<T> {
  const bucket = getBucket(bucketKey);
  const { range, maPeriod } = bucket;
  endDate = endDate || new Date();
  const startDate = sub(sub(endDate, range), maPeriod); // extra range for moving average
  return {
    ...bucket,
    startDate,
    endDate,
    startTimestamp: dateToTimestamp(startDate),
    endTimestamp: dateToTimestamp(endDate),
    startUnix: getUnixTime(startDate),
    endUnix: getUnixTime(endDate),
  };
}

import fetch from 'node-fetch';
import { getBucketDurationAndPeriod, TimeBucket } from './common.js';

export type RangedDataPoint = {
  t: number;
  min: string;
  v: string;
  max: string;
};

type RangeSnapshot = {
  id: string;
  roundedTimestamp: string;
  timestamp: string;
  currentPriceOfToken0InToken1: string;
  priceRangeMin1: string;
  priceRangeMax1: string;
};

type RangeGraphResponse = {
  data: {
    beefyCLVault: null | {
      id: string;
      snaps: RangeSnapshot[];
    };
  };
};

export async function getClmRanges(
  vault_id: string,
  chain: string,
  bucket: TimeBucket
): Promise<RangedDataPoint[] | null> {
  const bucketData = getBucketDurationAndPeriod(bucket);
  const response = (await fetch(
    `https://api.0xgraph.xyz/subgraphs/name/beefyfinance/clm-${chain.toLowerCase()}`,
    {
      body:
        '{"query":"query HistoricRange {\\n  beefyCLVault(id: \\"' +
        vault_id.toLowerCase() +
        '\\") {\\n    id\\n    snaps: snapshots(\\n      where: {period: ' +
        bucketData.duration +
        ', roundedTimestamp_gte: ' +
        bucketData.startDate +
        '}\\n      orderBy: timestamp\\n      orderDirection: asc\\n    ) {\\n      id\\n      roundedTimestamp\\n      timestamp\\n      currentPriceOfToken0InToken1\\n      priceRangeMin1\\n      priceRangeMax1\\n    }\\n  }\\n}","operationName":"HistoricRange","extensions":{}}',
      method: 'POST',
    }
  ).then(res => res.json())) as RangeGraphResponse;

  if (!response.data.beefyCLVault) {
    return null;
  }

  return response.data.beefyCLVault.snaps.map(snap => ({
    t: parseInt(snap.roundedTimestamp),
    min: snap.priceRangeMin1,
    v: snap.currentPriceOfToken0InToken1,
    max: snap.priceRangeMax1,
  }));
}

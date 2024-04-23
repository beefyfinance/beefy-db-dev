import fetch from 'node-fetch';
import { getBucketDurationAndPeriod, TimeBucket } from './common.js';
import { Range } from './ranges.js';

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

type MinMaxRangeGraphResponse = {
  data: {
    beefyCLVault: null | {
      id: string;
      minSnaphot: { v: string }[];
      maxSnapshot: { v: string }[];
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

export type ClmRange = null | {
  clm: Range;
};

export async function getGraphRanges(
  chain: string,
  vaultAddress: string
): Promise<ClmRange | null> {
  try {
    const response = (await fetch(
      `https://api.0xgraph.xyz/subgraphs/name/beefyfinance/clm-${chain}`,
      {
        body: `{\"query\":\"query HistoricRangeMaxMin {\\n  beefyCLVault(id: \\\"${vaultAddress}\\\") {\\n    id\\n    minSnaphot: snapshots(\\n      where: {period: 3600}\\n      orderBy: timestamp\\n      orderDirection: asc\\n      first: 1\\n    ) {\\n      v: roundedTimestamp\\n    }\\n    maxSnapshot: snapshots(\\n      where: {period: 3600}\\n      orderBy: timestamp\\n      orderDirection: desc\\n      first: 1\\n    ) {\\n      v: roundedTimestamp\\n    }\\n  }\\n}\",\"operationName\":\"HistoricRangeMaxMin\",\"extensions\":{}}`,
        method: 'POST',
      }
    ).then(res => res.json())) as MinMaxRangeGraphResponse;

    if (!response.data.beefyCLVault) {
      return null;
    }

    return {
      clm: {
        min: parseInt(response.data.beefyCLVault.minSnaphot[0]?.v || '0'),
        max: parseInt(response.data.beefyCLVault.maxSnapshot[0]?.v || '0'),
      },
    };
  } catch (err: any) {
    console.error(err.message);
    return null;
  }
}

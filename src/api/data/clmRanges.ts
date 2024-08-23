import fetch from 'node-fetch';
import { Range } from './ranges.js';
import { CLM_API } from '../../common/config.js';
import { logger } from '../logger.js';
import { getBucketParams, TimeBucket } from './timeBuckets.js';

type ClmApiHistoricPrice = {
  type: 'clm';
  timestamp: number;
  rangeMin: string;
  currentPrice: string;
  rangeMax: string;
};

type ClmApiHistoricPricesResponse = Array<ClmApiHistoricPrice>;

function isClmApiHistoricPrice(data: any): data is ClmApiHistoricPrice {
  return (
    data &&
    typeof data.timestamp === 'number' &&
    typeof data.rangeMin === 'string' &&
    typeof data.currentPrice === 'string' &&
    typeof data.rangeMax === 'string' &&
    typeof data.type === 'string' &&
    data.type === 'clm'
  );
}

function isClmApiHistoricPricesResponse(data: any): data is ClmApiHistoricPricesResponse {
  return data && Array.isArray(data) && data.every(isClmApiHistoricPrice);
}

export type RangedDataPoint = {
  t: number;
  min: string;
  v: string;
  max: string;
};

export async function getClmHistoricPrices(
  vault_address: string,
  chain: string,
  bucket: TimeBucket
): Promise<RangedDataPoint[]> {
  const bucketData = getBucketParams(bucket);
  const url = `${CLM_API}/api/v1/vault/${chain}/${vault_address.toLowerCase()}/prices/${
    bucketData.sizeKey
  }/${bucketData.startUnix}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch historic prices from upstream api: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  if (!isClmApiHistoricPricesResponse(data)) {
    throw new Error('Invalid response for historic prices from upstream api');
  }

  return data.map(item => ({
    t: item.timestamp,
    min: item.rangeMin,
    v: item.currentPrice,
    max: item.rangeMax,
  }));
}

type ClmHistoricPricesRangeResponse = Range;

function isClmHistoricPricesRangeResponse(data: any): data is ClmHistoricPricesRangeResponse {
  return data && typeof data.min === 'number' && typeof data.max === 'number';
}

export type ClmRange = {
  clm: Range;
};

export async function getClmHistoricPricesRange(
  chain: string,
  vault_address: string
): Promise<ClmRange | undefined> {
  try {
    const bucketData = getBucketParams('1d_1M');
    const url = `${CLM_API}/api/v1/vault/${chain}/${vault_address.toLowerCase()}/prices/range/${
      bucketData.sizeKey
    }`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch historic prices range from upstream api: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!isClmHistoricPricesRangeResponse(data)) {
      throw new Error('Invalid response for historic prices range from upstream api');
    }

    return {
      clm: data,
    };
  } catch (err: unknown) {
    logger.error(err);
    return undefined;
  }
}

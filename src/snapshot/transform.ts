import { keyBy, mapValues } from 'lodash-es';
import { LpBreakdown, LpBreakdownResponse } from './beefy-api/types';
import { PriceOracleRowData } from './ids';

/**
 * Convert strings to numbers and return undefined if null, NaN and Infinity
 */
function transformNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    value = parseFloat(value);
  }

  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }

  return undefined;
}

/**
 * Convert strings to numbers and remove undefined, null, NaN and Infinity
 */
export function transformNumberRecord(input: Record<string, any>): Record<string, number> {
  return Object.entries(input).reduce((acc, [key, value]) => {
    const price = transformNumber(value);
    if (price !== undefined) {
      acc[key] = value;
    }

    return acc;
  }, {} as Record<string, number>);
}

export const transformApy = transformNumberRecord;
export const transformPrices = transformNumberRecord;

export const transformLpBreakdown = (input: LpBreakdownResponse): Record<string, LpBreakdown> => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (
      typeof value === 'object' &&
      'tokens' in value &&
      'balances' in value &&
      'totalSupply' in value &&
      value.totalSupply &&
      value.tokens &&
      value.balances &&
      value.tokens.length === value.balances.length
    ) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, LpBreakdown>);
};

export const transformLpBreakdownToPrices = (
  input: LpBreakdownResponse
): Record<string, number> => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (typeof value === 'object' && 'price' in value) {
      const price = transformNumber(value.price);
      if (price !== undefined) {
        acc[key] = price;
      }
    }
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Convert strings to numbers and remove undefined, null, NaN and Infinity, the flattens the object
 */
export function transformTvl(input: Record<string, Record<string, any>>): Record<string, number> {
  const byChainId = mapValues(input, value => transformNumberRecord(value));
  return Object.assign({}, ...Object.values(byChainId));
}

export function createPriceOracleData(
  oracleIds: string[],
  lpBreakdown: Record<string, LpBreakdown>
): Record<string, PriceOracleRowData> {
  const oracleIdData = oracleIds.map(oracle_id => ({ oracle_id, tokens: [] as string[] }));
  const breakdownData = Object.entries(lpBreakdown).map(([oracle_id, breakdown]) => ({
    oracle_id,
    tokens: breakdown.tokens,
  }));

  const oracleIdMap = keyBy(oracleIdData, 'oracle_id');
  const breakdownMap = keyBy(breakdownData, 'oracle_id');

  // lp breakdown takes precedence as it has more info
  return Object.assign(oracleIdMap, breakdownMap);
}

import { keyBy, mapValues } from 'lodash-es';
import { LpBreakdown, LpBreakdownResponse } from './beefy-api/types';
import { PriceOracleRowData } from './ids';

/**
 * Convert strings to numbers and remove undefined, null, NaN and Infinity
 */
export function transformNumberRecord(input: Record<string, any>): Record<string, number> {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (typeof value === 'string') {
      value = parseFloat(value);
    }

    if (value === undefined || value === null) {
      return acc;
    }

    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      acc[key] = value;
    }

    return acc;
  }, {} as Record<string, number>);
}

export const transformApy = transformNumberRecord;
export const transformPrices = transformNumberRecord;
export const transformLps = transformNumberRecord;
export const transformLpBreakdown = (input: LpBreakdownResponse): Record<string, LpBreakdown> => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return acc;
    }
    if (
      typeof value === 'object' &&
      value.tokens &&
      value.balances &&
      value.tokens.length === value.balances.length
    ) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, LpBreakdown>);
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
  lpBreakdown: LpBreakdownResponse
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

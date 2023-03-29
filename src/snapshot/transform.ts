import { mapValues } from 'lodash-es';

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

/**
 * Convert strings to numbers and remove undefined, null, NaN and Infinity, the flattens the object
 */
export function transformTvl(input: Record<string, Record<string, any>>): Record<string, number> {
  const byChainId = mapValues(input, value => transformNumberRecord(value));
  return Object.assign({}, ...Object.values(byChainId));
}

import { groupBy, keyBy, mapValues, uniq } from 'lodash-es';
import {
  LpBreakdown,
  LpBreakdownResponse,
  type TvlBreakdown,
  type TvlBreakdownByChain,
  type TvlByVaultId,
  type TvlNonClmVaultTypes,
  type VaultIdsByType,
  type VaultsByType,
} from './beefy-api/types';
import { PriceOracleRowData } from './ids';
import { fromArray } from './utils.js';

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
export function transformTvl(input: Record<string, Record<string, any>>): TvlByVaultId {
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

/**
 * Return tvl by chain, in total, and split by clm, vault and gov
 */
export function transformVaultsTvlToTvlByChain(
  vaultsByType: VaultsByType,
  tvlByVaultId: TvlByVaultId
): TvlBreakdownByChain {
  const vaultsByTypeByChain = mapValues(vaultsByType, vaults => groupBy(vaults, v => v.network));
  const allChainIds = uniq(Object.values(vaultsByTypeByChain).flatMap(Object.keys));
  const nonClmTypes = ['gov', 'vault'] as const satisfies TvlNonClmVaultTypes;

  return fromArray(allChainIds, (chainId): TvlBreakdown => {
    const clmVaults = vaultsByTypeByChain.clm[chainId] || [];
    const clmAddresses = new Set(clmVaults.map(vault => vault.earnContractAddress));
    const vaultIdsByType = {
      clm: clmVaults.map(vault => vault.id),
      ...fromArray(nonClmTypes, (): string[] => []),
    };

    for (const type of nonClmTypes) {
      const vaults = vaultsByTypeByChain[type][chainId] || [];
      for (const vault of vaults) {
        if (clmAddresses.has(vault.tokenAddress)) {
          vaultIdsByType.clm.push(vault.id);
        } else {
          vaultIdsByType[type].push(vault.id);
        }
      }
    }

    return getTvlBreakdownForChain(tvlByVaultId, vaultIdsByType);
  });
}

/**
 * Sum tvl for each type of vault, add sum them up to get total for the chain
 */
function getTvlBreakdownForChain(
  tvlByVaultId: TvlByVaultId,
  vaultsByType: VaultIdsByType
): TvlBreakdown {
  const tvlByType = mapValues(vaultsByType, vaultIds =>
    vaultIds.reduce((acc, vaultId) => {
      acc += tvlByVaultId[vaultId] || 0;
      return acc;
    }, 0)
  );

  return {
    ...tvlByType,
    total: Object.values(tvlByType).reduce((total, typeTvl) => total + typeTvl, 0),
  };
}

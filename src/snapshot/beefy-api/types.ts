import type { TupleUnion } from '../type-utils.js';

export type TvlByVaultId = Record<string, number>;

export type LpBreakdown = {
  price: number;
  tokens: string[]; // token addresses: "0x...", "0x...", ...
  balances: string[]; // balance in token order: "1234.4567", "5678", ...
  totalSupply: string; // total supply: "1234.4567"
};

export type LpNoBreakdown = {
  price: number;
};

export interface Vault {
  id: string;
  type: 'standard' | 'gov' | 'cowcentrated';
  /** deposit token address */
  tokenAddress: string;
  /** vault contract */
  earnContractAddress: string;
  /** app chain id */
  network: string;
}

export type TvlVaultType = 'vault' | 'gov' | 'clm';
export type TvlNonClmVaultType = Exclude<TvlVaultType, 'clm'>;
export type TvlNonClmVaultTypes = Readonly<TupleUnion<TvlNonClmVaultType>>;

export type TvlBreakdown = {
  [K in TvlVaultType]: number;
} & {
  total: number;
};

export type VaultsByType = {
  [K in TvlVaultType]: Vault[];
};

export type VaultIdsByType = {
  [K in TvlVaultType]: string[];
};

export type TvlBreakdownByChain = Record<string, TvlBreakdown>;

export type ApyResponse = Record<string, number | string | undefined | null>;
export type PriceResponse = Record<string, number | string | undefined | null>;
export type TvlResponse = Record<string, Record<string, number | string | undefined | null>>;
export type LpBreakdownResponse = Record<string /* oracle id */, LpBreakdown | LpNoBreakdown>;
export type VaultResponse = Vault[];

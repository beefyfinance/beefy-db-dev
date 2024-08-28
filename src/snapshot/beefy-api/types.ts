export type ApyResponse = Record<string, number | string | undefined | null>;
export type PriceResponse = Record<string, number | string | undefined | null>;
export type TvlResponse = Record<string, Record<string, number | string | undefined | null>>;
export type VaultResponse = Record<string, Vault>;
export type LpBreakdown = {
  price: number;
  tokens: string[]; // token addresses: "0x...", "0x...", ...
  balances: string[]; // balance in token order: "1234.4567", "5678", ...
  totalSupply: string; // total supply: "1234.4567"
};
export type LpNoBreakdown = {
  price: number;
};
export type LpBreakdownResponse = Record<string /* oracle id */, LpBreakdown | LpNoBreakdown>;

//TODO: Add more types as needed
export interface Vault {
  id: string;
  type: string;
  strategyTypeId: string;
  oracleId: string;
}

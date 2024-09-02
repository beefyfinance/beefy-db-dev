import fetch from 'node-fetch';
import type {
  ApyResponse,
  LpBreakdownResponse,
  PriceResponse,
  TvlResponse,
  VaultResponse,
} from './types.js';

async function get<T>(path: string, cacheBuster: string): Promise<T> {
  const response = await fetch(`https://api.beefy.finance/${path}?_=${cacheBuster}`);
  return (await response.json()) as T;
}

export async function getApys(cacheBuster: string): Promise<ApyResponse> {
  return await get<ApyResponse>('apy', cacheBuster);
}

export async function getPrices(cacheBuster: string): Promise<PriceResponse> {
  return await get<PriceResponse>('prices', cacheBuster);
}

export async function getLpPrices(cacheBuster: string): Promise<PriceResponse> {
  return await get<PriceResponse>('lps', cacheBuster);
}

export async function getLpBreakdown(cacheBuster: string): Promise<LpBreakdownResponse> {
  return await get<LpBreakdownResponse>('lps/breakdown', cacheBuster);
}

export async function getTvls(cacheBuster: string): Promise<TvlResponse> {
  return await get<TvlResponse>('tvl', cacheBuster);
}

export async function getVaults(cacheBuster: string): Promise<VaultResponse> {
  return await get<VaultResponse>('vaults', cacheBuster);
}

export async function getGovVaults(cacheBuster: string): Promise<VaultResponse> {
  return await get<VaultResponse>('gov-vaults', cacheBuster);
}

export async function getCowVaults(cacheBuster: string): Promise<VaultResponse> {
  return await get<VaultResponse>('cow-vaults', cacheBuster);
}

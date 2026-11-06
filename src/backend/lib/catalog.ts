import type {ProductOption} from '../../shared/types';
import {requestJson} from './http';

// The site's product catalog API (optimizely-nextjs-demo /api/catalog/products). Only the
// fields the picker shows are read; the site renders everything else from its own copy.

interface CatalogRate {
  value?: number;
  label?: string;
  basis?: string;
  note?: string;
}

interface CatalogProduct {
  id?: string;
  name?: string;
  category?: string;
  rate?: CatalogRate;
}

export interface Catalog {
  updatedAt?: string;
  products?: CatalogProduct[];
}

const CATEGORY_LABELS: Record<string, string> = {
  'savings': 'Savings',
  'current-account': 'Current accounts',
  'credit-card': 'Credit cards',
  'mortgage': 'Mortgages',
  'business': 'Business',
  'investment': 'Investments',
};

const CACHE_MS = 5 * 60 * 1000;

// Module scope survives warm invocations of the function.
let cache: {url: string; at: number; catalog: Catalog} | null = null;

function rateText(rate: CatalogRate | undefined): string {
  return typeof rate?.value === 'number' ? `${rate.value.toFixed(2)}% ${rate.label ?? ''}`.trim() : '';
}

/** Catalog → picker options, in catalog order (the site groups it by category). */
export function toOptions(catalog: Catalog | null): ProductOption[] {
  return (catalog?.products ?? [])
    .filter((p): p is CatalogProduct & {id: string; name: string} => Boolean(p.id && p.name))
    .map((p) => {
      const rate = rateText(p.rate);
      const detail = [rate && [rate, p.rate?.basis].filter(Boolean).join(', '), p.rate?.note].filter(Boolean).join('. ');
      return {
        value: p.id,
        label: rate ? `${p.name}: ${rate}` : p.name,
        group: CATEGORY_LABELS[p.category ?? ''] ?? 'Other',
        detail,
      };
    });
}

export async function fetchCatalog(url: string, now = Date.now()): Promise<Catalog> {
  if (cache && cache.url === url && now - cache.at < CACHE_MS) return cache.catalog;
  const catalog = (await requestJson<Catalog>('catalog', 'Product catalog', url)) ?? {};
  cache = {url, at: now, catalog};
  return catalog;
}

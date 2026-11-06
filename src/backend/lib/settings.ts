import {logger, storage, ValueHash} from '@zaiusinc/app-sdk';

import {DEFAULT_PICKER_CONTENT_TYPES} from '../../shared/constants';
import type {CmsConfig} from './cms';

// Section keys match forms/settings.yml.
// Type aliases, not interfaces: the settings store requires an index-signature-compatible shape.
export type CatalogSettings = {
  siteUrl?: string;
  contentTypes?: string;
};

export type CmsSettings = {
  clientId?: string;
  clientSecret?: string;
};

export interface PickerConfig {
  catalogUrl: string;
  /** Lower-cased content type keys whose long-string field becomes the picker. */
  contentTypes: string[];
  cms: CmsConfig;
}

/** https://host[/path] without a trailing slash, or null. */
export function normalizeSiteUrl(raw: string | undefined): string | null {
  const value = raw?.trim() ?? '';
  if (!/^https?:\/\/[^\s/]+/i.test(value)) return null;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

/** "ProductSpotlight, OfferCard" → ["productspotlight", "offercard"]; blank → the default. */
export function parseContentTypes(raw: string | undefined): string[] {
  const keys = (raw ?? '')
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  return keys.length > 0 ? keys : DEFAULT_PICKER_CONTENT_TYPES.map((k) => k.toLowerCase());
}

export function catalogUrl(siteUrl: string): string {
  return `${siteUrl}/api/catalog/products`;
}

/**
 * One settings section, or {} when the store can't be read. On a CMS-scoped install that has
 * never saved its settings, the production store throws "Failed to get value at
 * app-data/<install>/settings" instead of returning {}.
 */
export async function readSection<T extends ValueHash>(section: string): Promise<T> {
  try {
    return await storage.settings.get<T>(section);
  } catch (error) {
    logger.warn('Could not read settings section', section, error);
    return {} as T;
  }
}

/** Null until both sections are filled in; the editor then stays a plain text field. */
export async function loadConfig(): Promise<PickerConfig | null> {
  const [catalog, cms] = await Promise.all([readSection<CatalogSettings>('catalog'), readSection<CmsSettings>('cms')]);
  const siteUrl = normalizeSiteUrl(catalog.siteUrl);
  const clientId = cms.clientId?.trim() ?? '';
  const clientSecret = cms.clientSecret?.trim() ?? '';
  if (!siteUrl || !clientId || !clientSecret) return null;
  return {catalogUrl: catalogUrl(siteUrl), contentTypes: parseContentTypes(catalog.contentTypes), cms: {clientId, clientSecret}};
}

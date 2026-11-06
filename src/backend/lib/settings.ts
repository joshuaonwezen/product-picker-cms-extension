import {logger, storage, ValueHash} from '@zaiusinc/app-sdk';

// Section keys match forms/settings.yml.
// A type alias, not an interface: the settings store requires an index-signature-compatible shape.
export type CatalogSettings = {
  siteUrl?: string;
};

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

/** The catalog URL, or null until the site URL is saved. */
export async function loadCatalogUrl(): Promise<string | null> {
  const siteUrl = normalizeSiteUrl((await readSection<CatalogSettings>('catalog')).siteUrl);
  return siteUrl ? catalogUrl(siteUrl) : null;
}

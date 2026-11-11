import {logger, resetLocalSettingsStore, storage} from '@zaiusinc/app-sdk';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {loadCatalogUrl, normalizeSiteUrl} from './settings';

describe('settings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetLocalSettingsStore();
  });

  it('normalizes the site URL', () => {
    expect(normalizeSiteUrl(' https://www.example.com/ ')).toBe('https://www.example.com');
    expect(normalizeSiteUrl('www.example.com')).toBeNull();
  });

  it('has no catalog until the site URL is saved', async () => {
    // What the production store throws on an install that has never saved its settings.
    vi.spyOn(storage.settings, 'get').mockRejectedValue(new Error('Failed to get value at app-data/1/settings'));
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    expect(await loadCatalogUrl()).toBeNull();
  });

  it('builds the catalog URL from the saved site URL', async () => {
    await storage.settings.put('catalog', {siteUrl: 'https://www.example.com'});
    expect(await loadCatalogUrl()).toBe('https://www.example.com/api/catalog/products');
  });
});

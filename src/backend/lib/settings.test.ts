import {logger, resetLocalSettingsStore, storage} from '@zaiusinc/app-sdk';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {loadConfig, normalizeSiteUrl, parseContentTypes} from './settings';

describe('settings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetLocalSettingsStore();
  });

  it('defaults the picker to ProductSpotlight and lower-cases a configured list', () => {
    expect(parseContentTypes('')).toEqual(['productspotlight']);
    expect(parseContentTypes(' ProductSpotlight, OfferCard ,')).toEqual(['productspotlight', 'offercard']);
  });

  it('normalizes the site URL', () => {
    expect(normalizeSiteUrl(' https://optimizely-onboarding.vercel.app/ ')).toBe('https://optimizely-onboarding.vercel.app');
    expect(normalizeSiteUrl('optimizely-onboarding.vercel.app')).toBeNull();
  });

  it('leaves every field a text field until both sections are saved', async () => {
    // What the production store throws on an install that has never saved its settings.
    vi.spyOn(storage.settings, 'get').mockRejectedValue(new Error('Failed to get value at app-data/1/settings'));
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    expect(await loadConfig()).toBeNull();
  });

  it('builds the catalog URL from saved settings', async () => {
    await storage.settings.put('catalog', {siteUrl: 'https://optimizely-onboarding.vercel.app', contentTypes: ''});
    await storage.settings.put('cms', {clientId: 'id', clientSecret: 'secret'});
    expect(await loadConfig()).toEqual({
      catalogUrl: 'https://optimizely-onboarding.vercel.app/api/catalog/products',
      contentTypes: ['productspotlight'],
      cms: {clientId: 'id', clientSecret: 'secret'},
    });
  });
});

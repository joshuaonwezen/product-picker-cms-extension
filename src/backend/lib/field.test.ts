import {afterEach, describe, expect, it, vi} from 'vitest';

import type {CmsClient} from './cms';
import {fieldMode} from './field';

const CONFIG = {
  catalogUrl: 'https://site.example/api/catalog/products',
  contentTypes: ['productspotlight'],
  cms: {clientId: 'id', clientSecret: 'secret'},
};

function cmsReturning(contentType: string | null) {
  const getItem = vi.fn(() => Promise.resolve(contentType ? {key: 'k', contentType} : null));
  return {cms: {getItem} as unknown as CmsClient, getItem};
}

describe('fieldMode', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is the product picker on a configured content type', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({updatedAt: '2026-11-06', products: [{id: 'cash-isa', name: 'Easy Access Cash ISA', category: 'savings'}]}), {
            status: 200,
          }),
        ),
      ),
    );
    const {cms} = cmsReturning('ProductSpotlight');
    expect(await fieldMode(CONFIG, cms, {key: 'aaaa-1111'})).toEqual({
      mode: 'picker',
      contentType: 'ProductSpotlight',
      updatedAt: '2026-11-06',
      options: [{value: 'cash-isa', label: 'Easy Access Cash ISA', group: 'Savings', detail: ''}],
    });
  });

  it('stays a text field on every other content type, without reading the catalog', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const {cms} = cmsReturning('ArticlePage');
    expect(await fieldMode(CONFIG, cms, {key: 'bbbb-2222'})).toEqual({mode: 'text', contentType: 'ArticlePage'});
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('looks each item up once, however many of its fields ask', async () => {
    const {cms, getItem} = cmsReturning('ArticlePage');
    await fieldMode(CONFIG, cms, {key: 'cccc-3333'});
    await fieldMode(CONFIG, cms, {key: 'CCCC3333'});
    expect(getItem).toHaveBeenCalledTimes(1);
  });

  it('stays a text field without an open item', async () => {
    const {cms} = cmsReturning('ProductSpotlight');
    expect(await fieldMode(CONFIG, cms, undefined)).toEqual({mode: 'text', contentType: null});
  });
});

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {CmsClient} from './cms';
import {fieldMode, unpickedElements} from './field';

const CONFIG = {
  catalogUrl: 'https://site.example/api/catalog/products',
  contentTypes: ['productspotlight'],
  cms: {clientId: 'id', clientSecret: 'secret'},
};
const CATALOG = {updatedAt: '2026-11-06', products: [{id: 'cash-isa', name: 'Easy Access Cash ISA', category: 'savings'}]};
const OPTIONS = [{value: 'cash-isa', label: 'Easy Access Cash ISA', group: 'Savings', detail: ''}];

// What CMS REST returns for an experience draft: elements nest under composition.nodes.
function experience(...spotlights: Array<Record<string, unknown> | null>) {
  return {
    contentType: 'DynamicExperience',
    composition: {
      nodes: [
        {nodeType: 'component', component: {contentType: 'HeroBlock', properties: {headline: {value: 'Hello'}}}},
        ...spotlights.map((properties) => ({nodeType: 'component', component: {contentType: 'ProductSpotlight', properties}})),
      ],
    },
  };
}

function cmsFor(contentType: string | null, version: unknown = null) {
  const getItem = vi.fn(() => Promise.resolve(contentType ? {key: 'k', contentType} : null));
  const getVersion = vi.fn(() => Promise.resolve(version));
  return {cms: {getItem, getVersion} as unknown as CmsClient, getItem, getVersion};
}

// Each test runs at its own time, so the module-level caches never carry over.
let now = 0;

describe('fieldMode', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    now += 60 * 60 * 1000;
    fetchSpy = vi.fn(() => Promise.resolve(new Response(JSON.stringify(CATALOG), {status: 200})));
    vi.stubGlobal('fetch', fetchSpy);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('is the picker wherever the field already holds a catalog product ID', async () => {
    const {cms, getItem} = cmsFor('DynamicExperience');
    expect(await fieldMode(CONFIG, cms, {key: 'a1', version: '7'}, 'cash-isa', now)).toEqual({
      mode: 'picker',
      reason: 'value',
      contentType: null,
      updatedAt: '2026-11-06',
      options: OPTIONS,
    });
    expect(getItem).not.toHaveBeenCalled();
  });

  it('leaves any other filled field as text, without reading the catalog', async () => {
    const {cms} = cmsFor('ProductSpotlight');
    expect(await fieldMode(CONFIG, cms, {key: 'a2'}, 'Our best savings rate', now)).toEqual({mode: 'text', contentType: null});
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('is the picker on an empty field of a configured content type (a shared block)', async () => {
    const {cms} = cmsFor('ProductSpotlight');
    expect(await fieldMode(CONFIG, cms, {key: 'a3'}, '', now)).toMatchObject({mode: 'picker', reason: 'type', contentType: 'ProductSpotlight'});
  });

  it('is the picker on an empty field of a page with an inline element that has no product yet', async () => {
    const {cms, getVersion} = cmsFor('DynamicExperience', experience(null));
    expect(await fieldMode(CONFIG, cms, {key: 'a4', version: '4053'}, '', now)).toMatchObject({mode: 'picker', reason: 'element'});
    expect(getVersion).toHaveBeenCalledWith('a4', '4053');
  });

  it('leaves empty fields as text once every inline element has a product', async () => {
    const {cms} = cmsFor('DynamicExperience', experience({productId: {value: 'cash-isa'}}));
    expect(await fieldMode(CONFIG, cms, {key: 'a5', version: '1'}, '', now)).toEqual({mode: 'text', contentType: 'DynamicExperience'});
  });

  it('leaves empty fields as text on a page without the element', async () => {
    const {cms} = cmsFor('ArticlePage', {contentType: 'ArticlePage', properties: {title: {value: ''}}});
    expect(await fieldMode(CONFIG, cms, {key: 'a6', version: '1'}, '', now)).toEqual({mode: 'text', contentType: 'ArticlePage'});
  });

  it('reads the item and its draft once, however many of its fields ask', async () => {
    const {cms, getItem, getVersion} = cmsFor('DynamicExperience', experience(null));
    await Promise.all([1, 2, 3].map(() => fieldMode(CONFIG, cms, {key: 'aa-77', version: '2'}, '', now)));
    await fieldMode(CONFIG, cms, {key: 'AA77', version: '2'}, '', now);
    expect(getItem).toHaveBeenCalledTimes(1);
    expect(getVersion).toHaveBeenCalledTimes(1);
  });

  it('stays a text field without an open item', async () => {
    const {cms} = cmsFor('ProductSpotlight');
    expect(await fieldMode(CONFIG, cms, undefined, '', now)).toEqual({mode: 'text', contentType: null});
  });
});

describe('unpickedElements', () => {
  const ids = new Set(['cash-isa']);

  it('counts elements in nested sections and in extra composition properties', () => {
    const item = {
      composition: {nodes: [{nodeType: 'section', nodes: [{nodes: [{nodes: [{component: {contentType: 'ProductSpotlight', properties: null}}]}]}]}]},
      properties: {topComposition: {value: {nodes: [{component: {contentType: 'productspotlight', properties: {heading: {value: 'Hi'}}}}]}}},
    };
    expect(unpickedElements(item, ['productspotlight'], ids)).toBe(2);
  });

  it('ignores elements that hold a catalog product and other content types', () => {
    const item = experience({productId: {value: 'cash-isa'}});
    expect(unpickedElements(item, ['productspotlight'], ids)).toBe(0);
    expect(unpickedElements(experience(null), ['offercard'], ids)).toBe(0);
  });
});

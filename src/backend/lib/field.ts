import type {ContentRef, FieldResult, ProductOption} from '../../shared/types';
import {fetchCatalog, toOptions} from './catalog';
import type {CmsClient} from './cms';
import type {PickerConfig} from './settings';

const TYPE_CACHE_MS = 10 * 60 * 1000;
// Short on purpose: the editor adds an element and its fields ask straight away, so an
// older read would miss the element that was just added.
const VERSION_CACHE_MS = 3_000;

// A content item's type never changes, and every long-string field of an item asks at
// once, so remember it per key - the pending read too, so they share one. Module scope
// survives warm invocations.
const typeCache = new Map<string, {at: number; contentType: Promise<string | null>}>();
const versionCache = new Map<string, {at: number; version: Promise<unknown>}>();

function normalizeKey(key: string): string {
  return key.replace(/-/g, '').toLowerCase();
}

export function contentTypeOf(cms: CmsClient, key: string, now = Date.now()): Promise<string | null> {
  const id = normalizeKey(key);
  const hit = typeCache.get(id);
  if (hit && now - hit.at < TYPE_CACHE_MS) return hit.contentType;
  const contentType = cms.getItem(id).then((item) => item?.contentType ?? null);
  typeCache.set(id, {at: now, contentType});
  contentType.catch(() => typeCache.delete(id));
  return contentType;
}

function readVersion(cms: CmsClient, key: string, version: string, now: number): Promise<unknown> {
  const id = `${normalizeKey(key)}:${version}`;
  const hit = versionCache.get(id);
  if (hit && now - hit.at < VERSION_CACHE_MS) return hit.version;
  const read = cms.getVersion(normalizeKey(key), version);
  versionCache.set(id, {at: now, version: read});
  read.catch(() => versionCache.delete(id));
  return read;
}

function unwrap(value: unknown): unknown {
  return value && typeof value === 'object' && 'value' in value ? (value as {value: unknown}).value : value;
}

/**
 * Inline elements of the picker's content types that hold no catalog product yet, anywhere
 * in the item: the built-in composition and any extra composition property.
 */
export function unpickedElements(item: unknown, contentTypes: string[], productIds: Set<string>): number {
  let count = 0;
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    const component = (node as {component?: {contentType?: unknown; properties?: Record<string, unknown> | null}}).component;
    if (typeof component?.contentType === 'string' && contentTypes.includes(component.contentType.toLowerCase())) {
      const values = Object.values(component.properties ?? {}).map(unwrap);
      if (!values.some((v) => typeof v === 'string' && productIds.has(v.trim()))) count++;
    }
    Object.values(node).forEach(walk);
  };
  walk(item);
  return count;
}

function picker(reason: 'value' | 'type' | 'element', contentType: string | null, updatedAt: string, options: ProductOption[]): FieldResult {
  return {mode: 'picker', reason, contentType, updatedAt, options};
}

/**
 * Picker or plain text for the field being edited. The CMS mounts the editor on every
 * long-string property and says neither which property nor, for an inline Visual Builder
 * element, which element: the open item is the page. So, in order:
 * - a field that already holds a catalog product ID is the product field;
 * - any other filled field is text;
 * - on an item of a configured type (a shared block) the empty field is the product field;
 * - on a page whose draft holds an element of a configured type with no product yet, an
 *   empty field is probably that element's product field. Probably: another empty long
 *   string on the same page looks the same, so the editor can switch it back to text.
 */
export async function fieldMode(
  config: PickerConfig,
  cms: CmsClient,
  content: ContentRef | undefined,
  value: string,
  now = Date.now(),
): Promise<FieldResult> {
  if (!content?.key) return {mode: 'text', contentType: null};
  const stored = value.trim();
  const loadOptions = async () => {
    const catalog = await fetchCatalog(config.catalogUrl, now);
    return {updatedAt: catalog.updatedAt ?? '', options: toOptions(catalog)};
  };

  if (stored) {
    // A product ID is a slug; anything else can't be one, so skip the catalog read.
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(stored)) return {mode: 'text', contentType: null};
    const {updatedAt, options} = await loadOptions();
    return options.some((o) => o.value === stored)
      ? picker('value', null, updatedAt, options)
      : {mode: 'text', contentType: null};
  }

  const contentType = await contentTypeOf(cms, content.key, now);
  if (contentType && config.contentTypes.includes(contentType.toLowerCase())) {
    const {updatedAt, options} = await loadOptions();
    return picker('type', contentType, updatedAt, options);
  }
  if (!content.version) return {mode: 'text', contentType};

  const [item, {updatedAt, options}] = await Promise.all([readVersion(cms, content.key, content.version, now), loadOptions()]);
  const productIds = new Set(options.map((o) => o.value));
  return unpickedElements(item, config.contentTypes, productIds) > 0
    ? picker('element', contentType, updatedAt, options)
    : {mode: 'text', contentType};
}

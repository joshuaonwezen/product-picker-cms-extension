import type {ContentRef, FieldResult} from '../../shared/types';
import {fetchCatalog, toOptions} from './catalog';
import type {CmsClient} from './cms';
import type {PickerConfig} from './settings';

const TYPE_CACHE_MS = 10 * 60 * 1000;

// A content item's type never changes, and every long-string field of an item asks at
// once, so remember it per key. Module scope survives warm invocations.
const typeCache = new Map<string, {at: number; contentType: string | null}>();

function normalizeKey(key: string): string {
  return key.replace(/-/g, '').toLowerCase();
}

export async function contentTypeOf(cms: CmsClient, key: string, now = Date.now()): Promise<string | null> {
  const id = normalizeKey(key);
  const hit = typeCache.get(id);
  if (hit && now - hit.at < TYPE_CACHE_MS) return hit.contentType;
  const contentType = (await cms.getItem(id))?.contentType ?? null;
  typeCache.set(id, {at: now, contentType});
  return contentType;
}

/**
 * Picker or plain text for the field being edited. The CMS mounts the editor on every
 * long-string property and doesn't say which one, so the content type decides: the
 * configured types (whose only long string is the product field) get the picker.
 */
export async function fieldMode(config: PickerConfig, cms: CmsClient, content: ContentRef | undefined): Promise<FieldResult> {
  if (!content?.key) return {mode: 'text', contentType: null};
  const contentType = await contentTypeOf(cms, content.key);
  if (!contentType || !config.contentTypes.includes(contentType.toLowerCase())) return {mode: 'text', contentType};
  const catalog = await fetchCatalog(config.catalogUrl);
  return {mode: 'picker', contentType, updatedAt: catalog.updatedAt ?? '', options: toOptions(catalog)};
}

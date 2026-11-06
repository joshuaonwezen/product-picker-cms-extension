// The contract between the property editor and the cms_extension function. The UI sends
// {action, params}; the function answers with an Envelope.

export type Envelope<T> =
  | {ok: true; result: T}
  | {ok: false; error: string; message?: string};

export interface ContentRef {
  key: string;
  locale?: string;
  version?: string;
}

export interface ProductOption {
  /** What the property stores: the catalog product ID. */
  value: string;
  /** "1-Year Fixed Saver: 5.10% AER". */
  label: string;
  /** Category, for <optgroup>. */
  group: string;
  /** "5.10% AER, fixed. Rate fixed for 12 months" - shown under the picked product. */
  detail: string;
}

/**
 * How the editor renders this field. Property editors mount on every long-string
 * property, so the picker only appears where the field is the product field; everywhere
 * else it is a plain text field. `reason` says how the backend knew:
 * - `value`: the field already holds a catalog product ID;
 * - `type`: the open item is one of the configured content types (a shared block);
 * - `element`: the open page has an inline element of that type with no product yet. Only
 *   a best guess, since another empty long string on the page looks the same.
 */
export type FieldResult =
  | {mode: 'text'; contentType: string | null}
  | {
      mode: 'picker';
      reason: 'value' | 'type' | 'element';
      contentType: string | null;
      updatedAt: string;
      options: ProductOption[];
    };

/** What the CMS hands the editor iframe, logged once to see whether it ever names the field. */
export interface EditorDiagnostics {
  search: string;
  hash: string;
  windowName: string;
  contentKeys: string[];
  propertyKeys: string[];
  definition: unknown;
}

export type ActionParams = {
  field: {
    content: ContentRef;
    value?: string;
    settings?: Record<string, unknown> | null;
    diagnostics?: EditorDiagnostics;
  };
};

export type ActionResults = {
  field: FieldResult;
};

export type ActionName = keyof ActionParams;

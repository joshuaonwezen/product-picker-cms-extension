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
 * property, so the picker only appears on the configured content types; everywhere else
 * the field is a plain text field.
 */
export type FieldResult =
  | {mode: 'text'; contentType: string | null}
  | {mode: 'picker'; contentType: string; updatedAt: string; options: ProductOption[]};

export type ActionParams = {
  field: {content: ContentRef; settings?: Record<string, unknown> | null};
};

export type ActionResults = {
  field: FieldResult;
};

export type ActionName = keyof ActionParams;

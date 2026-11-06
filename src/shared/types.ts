// The contract between the property editor and the cms_extension function. The UI sends
// {action, params}; the function answers with an Envelope.

export type Envelope<T> =
  | {ok: true; result: T}
  | {ok: false; error: string; message?: string};

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

export interface CatalogResult {
  updatedAt: string;
  options: ProductOption[];
}

export type ActionParams = {
  catalog: Record<string, never>;
};

export type ActionResults = {
  catalog: CatalogResult;
};

export type ActionName = keyof ActionParams;

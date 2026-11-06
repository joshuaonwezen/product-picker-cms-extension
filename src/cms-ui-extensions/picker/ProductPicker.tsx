import type {ExtensionContext} from '@optimizely/cms-extensibility-sdk';
import type {FieldResult, ProductOption} from '@shared/types';
import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties} from 'react';

import {call} from '../common/api';
import {useStringProperty} from '../common/useProperty';

// The CMS mounts this editor on EVERY long-string property and doesn't say which one,
// so it asks the backend once per field: on the configured content types it is the
// product picker, everywhere else a plain text field. Native controls and no component
// library keep the bundle small, since an item can have dozens of these iframes.

// Typing saves after a pause, so the CMS isn't sent every keystroke; leaving the field saves at once.
const SAVE_DELAY_MS = 400;

const CONTROL: CSSProperties = {
  font: 'inherit',
  fontSize: 14,
  lineHeight: 1.4,
  color: 'inherit',
  boxSizing: 'border-box',
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #c9cdc4',
  borderRadius: 8,
  background: '#fff',
};
const NOTE: CSSProperties = {fontSize: 12, color: '#5f6368', margin: '6px 0 0'};
const WARN: CSSProperties = {...NOTE, color: '#b3261e'};

export function ProductPicker({context}: {context: ExtensionContext}) {
  const {value, readonly, settings, loaded, save, saveError} = useStringProperty(context);
  const [field, setField] = useState<FieldResult | null>(null);

  // Once the property has loaded (so its settings go along), ask which mode this field is in.
  useEffect(() => {
    if (!loaded) return;
    let active = true;
    void (async () => {
      let next: FieldResult = {mode: 'text', contentType: null};
      try {
        const content = await context.content.get();
        if (content?.key) {
          next = await call(context, 'field', {
            content: {key: content.key, locale: content.locale, version: content.version},
            settings,
          });
        }
      } catch {
        // Any failure leaves a working text field rather than a broken one.
      }
      if (active) setField(next);
    })();
    return () => {
      active = false;
    };
    // `settings` is left out on purpose: it arrives with the first load, and a later
    // change (the value being edited) doesn't change which mode the field is in.
  }, [context, loaded]);

  return (
    <div style={{padding: 2}}>
      {field?.mode === 'picker' ? (
        <ProductSelect onPick={(id) => void save(id)} options={field.options} readonly={readonly} updatedAt={field.updatedAt} value={value} />
      ) : (
        <TextField disabled={readonly || !loaded} onSave={(text) => void save(text)} value={value} />
      )}
      {saveError && <p style={WARN}>{saveError}</p>}
    </div>
  );
}

function ProductSelect({
  options,
  value,
  readonly,
  updatedAt,
  onPick,
}: {
  options: ProductOption[];
  value: string;
  readonly: boolean;
  updatedAt: string;
  onPick: (id: string) => void;
}) {
  const picked = options.find((o) => o.value === value);
  const groups = new Map<string, ProductOption[]>();
  for (const o of options) groups.set(o.group, [...(groups.get(o.group) ?? []), o]);

  return (
    <>
      {/* Native select: the browser draws its menu, so the field's iframe can't clip it. */}
      <select aria-label="Product" disabled={readonly} onChange={(e) => onPick(e.target.value)} style={CONTROL} value={value}>
        <option value="">- Choose a product -</option>
        {/* Keep a stored ID the catalog no longer lists, so opening the item doesn't wipe it. */}
        {value && !picked && <option value={value}>{value} (not in the catalog)</option>}
        {[...groups].map(([group, items]) => (
          <optgroup key={group} label={group}>
            {items.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {picked?.detail && <p style={NOTE}>{picked.detail}</p>}
      {value && !picked && <p style={WARN}>&quot;{value}&quot; is not in the product catalog any more.</p>}
      <p style={NOTE}>
        {options.length} products from the catalog{updatedAt ? `, updated ${updatedAt}` : ''}. The site always shows the
        catalog&apos;s current name and rate.
      </p>
    </>
  );
}

function TextField({value, disabled, onSave}: {value: string; disabled: boolean; onSave: (text: string) => void}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  const timer = useRef<number | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Follow the CMS value (initial load, undo, another editor) unless the editor is typing.
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  // Grow with the text, like the CMS's own long-string field.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [draft]);

  const cancelPending = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancelPending, []);

  return (
    <textarea
      aria-label="Value"
      disabled={disabled}
      onBlur={() => {
        focused.current = false;
        cancelPending();
        if (draft !== value) onSave(draft);
      }}
      onChange={(e) => {
        const text = e.target.value;
        setDraft(text);
        cancelPending();
        timer.current = window.setTimeout(() => {
          timer.current = null;
          onSave(text);
        }, SAVE_DELAY_MS);
      }}
      onFocus={() => {
        focused.current = true;
      }}
      ref={ref}
      rows={1}
      style={{...CONTROL, resize: 'vertical', overflow: 'hidden'}}
      value={draft}
    />
  );
}

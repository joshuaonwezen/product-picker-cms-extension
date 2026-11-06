import type {ExtensionContext, PropertyState} from '@optimizely/cms-extensibility-sdk';
import {useCallback, useEffect, useState} from 'react';

/** The bound string property of a property-editor extension, kept in sync with the editor. */
export function useStringProperty(context: ExtensionContext) {
  const [value, setValue] = useState('');
  const [readonly, setReadonly] = useState(true);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const apply = (state: PropertyState) => {
      if (!active) return;
      setValue(typeof state.value === 'string' ? state.value : '');
      setReadonly(state.readonly);
      setSettings(state.settings ?? null);
      setLoaded(true);
    };
    // Initial value - subscribe() only reports later changes.
    void context.property.get().then(apply);
    const unsubscribe = context.property.subscribe(apply);
    void context.extension.setReady();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [context]);

  const save = useCallback(
    async (next: string) => {
      setValue(next);
      const result = await context.property.set(next);
      setSaveError(result.success ? null : result.error || 'The CMS rejected the value.');
    },
    [context],
  );

  return {value, readonly, settings, loaded, save, saveError};
}

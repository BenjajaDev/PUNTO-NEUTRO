import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export type TabItem<K extends string> = { key: K; label: ReactNode; count?: number };

type TabsProps<K extends string> = {
  tabs: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Prefijo de ids: la pestaña es `${idPrefix}-tab-${key}` y su panel `${idPrefix}-panel-${key}`. */
  idPrefix: string;
  label: string;
};

export const tabPanelProps = (idPrefix: string, key: string) => ({
  role: 'tabpanel' as const,
  id: `${idPrefix}-panel-${key}`,
  'aria-labelledby': `${idPrefix}-tab-${key}`,
  tabIndex: 0,
});

/**
 * Pestañas accesibles (patrón WAI-ARIA «tabs»): solo la pestaña activa entra
 * en el orden de Tab, y las flechas, Inicio y Fin mueven y activan la selección.
 * El contenido se renderiza aparte con `tabPanelProps`.
 */
export function Tabs<K extends string>({ tabs, value, onChange, idPrefix, label }: TabsProps<K>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div className="tabs-bar" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => {
        const selected = tab.key === value;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.key}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.key}`}
            tabIndex={selected ? 0 : -1}
            className="tabs-bar__tab"
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
            {tab.count !== undefined ? <span className="tabs-bar__count">{tab.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

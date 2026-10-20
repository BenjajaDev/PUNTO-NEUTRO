import { Plus, X } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { Button } from '@/ui';

/** Lista de textos cortos (etiquetas, responsabilidades, pilares). Enter agrega. */
export function ListField({ label, value, onChange, placeholder, hint, max = 12, error }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; hint?: string; max?: number; error?: string }) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const add = () => {
    const text = draft.trim().replace(/\s+/g, ' ');
    // Sin duplicados aunque cambien mayúsculas o tildes («Salud mental» = «salud mental»).
    const key = (v: string) => v.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!text || value.some((v) => key(v) === key(text)) || value.length >= max) return;
    onChange([...value, text]);
    setDraft('');
  };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
    }
  };
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      {value.length ? (
        <ul className="list-field">
          {value.map((item) => (
            <li key={item} className="badge list-field__item">
              {item}
              <button type="button" onClick={() => onChange(value.filter((v) => v !== item))} aria-label={`Quitar «${item}»`}>
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
        <input id={id} className="input" value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} disabled={value.length >= max} />
        <Button variant="secondary" icon={Plus} onClick={add} disabled={!draft.trim() || value.length >= max} aria-label={`Agregar a ${label}`} />
      </div>
      {error ? <span className="field__error" role="alert">{error}</span> : <span className="field__hint">{hint || `Escribe y presiona Enter. Máximo ${max}.`}</span>}
    </div>
  );
}

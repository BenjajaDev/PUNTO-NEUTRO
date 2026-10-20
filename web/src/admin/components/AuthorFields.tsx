import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Reference, TeamMember } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Button, SelectField, TextArea, TextField } from '@/ui';

/** Autora visible de la nota: se elige entre las integrantes del equipo (RF-04). */
export function AuthorSelect({ value, onChange, error, required }: { value: number | null; onChange: (id: number | null) => void; error?: string; required?: boolean }) {
  const team = useResource((signal) => api<TeamMember[]>('/admin/team', { signal }), []);
  const options = [{ value: '', label: team.loading ? 'Cargando equipo…' : 'Elige una integrante' }, ...(team.data || []).map((m) => ({ value: String(m.id), label: `${m.name} · ${m.role}` }))];
  return (
    <SelectField
      label={`Autora${required ? ' *' : ''}`}
      value={value ? String(value) : ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      options={options}
      error={error}
      hint={
        <>
          Se muestra con su foto y rol. ¿No aparece? Agrégala en <Link to="/admin/equipo">Equipo</Link>.
        </>
      }
    />
  );
}

/** Lista editable de referencias: cita (APA sugerido) + enlace opcional. */
export function ReferencesField({ value, onChange, error, required }: { value: Reference[]; onChange: (v: Reference[]) => void; error?: string; required?: boolean }) {
  const id = useId();
  const update = (index: number, patch: Partial<Reference>) => onChange(value.map((ref, i) => (i === index ? { ...ref, ...patch } : ref)));
  return (
    <fieldset className="references-field" aria-describedby={`${id}-hint`}>
      <legend className="field__label">Referencias y fuentes{required ? ' *' : ''}</legend>
      <p id={`${id}-hint`} className="field__hint">
        Libros, artículos académicos, informes o especialistas que respaldan la nota. Formato sugerido: APA (Autor, año, título, revista).{' '}
        <a href="https://normas-apa.org/referencias/" target="_blank" rel="noopener noreferrer">
          Guía APA <ExternalLink size={12} aria-hidden />
        </a>
      </p>
      {value.map((ref, index) => (
        <div key={index} className="references-field__row">
          <span className="references-field__n" aria-hidden>{index + 1}</span>
          <div className="stack-sm" style={{ flex: 1 }}>
            <TextArea label={`Cita ${index + 1}`} rows={2} maxLength={600} value={ref.citation} onChange={(e) => update(index, { citation: e.target.value })} />
            <TextField label="Enlace (opcional)" type="url" placeholder="https://doi.org/…" value={ref.url} onChange={(e) => update(index, { url: e.target.value })} />
          </div>
          <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Quitar referencia ${index + 1}`} onClick={() => onChange(value.filter((_, i) => i !== index))} />
        </div>
      ))}
      <Button variant="secondary" size="sm" icon={Plus} onClick={() => onChange([...value, { citation: '', url: '' }])} disabled={value.length >= 20} style={{ alignSelf: 'flex-start' }}>
        Agregar referencia
      </Button>
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}

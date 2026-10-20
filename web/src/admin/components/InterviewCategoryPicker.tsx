import { AlertCircle, Check } from 'lucide-react';
import { useId } from 'react';
import { INTERVIEW_CATEGORIES, type InterviewCategory } from '@/lib/types';

/** Categoría obligatoria de la entrevista: tres opciones excluyentes como tarjetas. */
export function InterviewCategoryPicker({ value, onChange, error }: { value: InterviewCategory | ''; onChange: (value: InterviewCategory) => void; error?: string }) {
  const name = useId();
  return (
    <fieldset className="category-picker" aria-invalid={Boolean(error) || undefined} aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="field__label">Categoría *</legend>
      <div className="category-picker__options">
        {INTERVIEW_CATEGORIES.map((c) => (
          <label key={c.key} className="category-picker__option" data-checked={value === c.key}>
            <input type="radio" name={name} value={c.key} checked={value === c.key} onChange={() => onChange(c.key)} />
            <span className="category-picker__check" aria-hidden>
              <Check size={14} />
            </span>
            <span className="category-picker__label">{c.label}</span>
            <span className="category-picker__desc">{c.description}</span>
          </label>
        ))}
      </div>
      {error ? (
        <span className="field__error" id={`${name}-error`} role="alert">
          <AlertCircle size={14} aria-hidden /> {error}
        </span>
      ) : (
        <span className="field__hint">Define en qué sección del sitio aparece la entrevista.</span>
      )}
    </fieldset>
  );
}

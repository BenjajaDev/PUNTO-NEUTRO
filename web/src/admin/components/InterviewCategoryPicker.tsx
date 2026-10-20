import { AlertCircle, Check } from 'lucide-react';
import { useId } from 'react';
import { INTERVIEW_CATEGORIES, type InterviewCategory } from '@/lib/types';

/** Preguntas sugeridas por categoría (el equipo puede cambiarlas). */
export const SUGGESTED_QUESTIONS: Record<InterviewCategory, [string, string, string]> = {
  EXPERTAS: [
    '¿Por qué las tendencias sobre el cuerpo en redes sociales afectan tanto la forma en que nos vemos?',
    '¿Qué señales indican que la preocupación por la imagen corporal se está volviendo un problema?',
    '¿Qué le recomendarías a una adolescente que siente presión por encajar?',
  ],
  INFLUENCERS: [
    '¿Cómo vives el escrutinio público sobre tu cuerpo en redes sociales?',
    '¿Has sentido presión por mantener cierta estética para tu contenido?',
    '¿Qué herramientas de autocuidado usas para gestionar la exposición mediática?',
  ],
  PERSONAS_COMUNES: [
    '¿Cuándo empezaste a notar la presión por verte de cierta manera?',
    '¿Cómo influyen las redes sociales o las personas cercanas en la forma en que ves tu cuerpo?',
    '¿Qué te ha ayudado a sentirte más en paz con tu cuerpo?',
  ],
};

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

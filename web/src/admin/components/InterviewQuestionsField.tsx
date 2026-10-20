import { ArrowDown, ArrowUp, Check, Lightbulb, Plus, Trash2 } from 'lucide-react';
import { useId, useRef } from 'react';
import { INTERVIEW_CATEGORIES, type InterviewCategory, type InterviewQuestion } from '@/lib/types';
import { Button, TextArea, useFeedback } from '@/ui';

export const MAX_QUESTIONS = 20;

/**
 * Banco de preguntas de ejemplo por categoría. Son solo sugerencias: no se
 * escriben solas en la entrevista, se agregan con un clic y se pueden editar.
 */
export const SUGGESTED_QUESTIONS: Record<InterviewCategory, string[]> = {
  EXPERTAS: [
    '¿Por qué las tendencias sobre el cuerpo en redes sociales afectan tanto la forma en que nos vemos?',
    '¿Qué señales indican que la preocupación por la imagen corporal se está volviendo un problema?',
    '¿Qué le recomendarías a una adolescente que siente presión por encajar?',
    '¿Qué es la neutralidad corporal y en qué se diferencia del body positive?',
    '¿Cómo podemos hablar del cuerpo de otras personas sin hacer daño?',
    '¿Dónde puede pedir ayuda alguien que lo está pasando mal con su imagen corporal?',
  ],
  INFLUENCERS: [
    '¿Cómo vives el escrutinio público sobre tu cuerpo en redes sociales?',
    '¿Has sentido presión por mantener cierta estética para tu contenido?',
    '¿Qué herramientas de autocuidado usas para gestionar la exposición mediática?',
    '¿Cómo manejas los comentarios sobre tu cuerpo?',
    '¿Qué responsabilidad crees que tienen las creadoras de contenido con su audiencia?',
    '¿Qué cambiarías de las redes sociales si pudieras?',
  ],
  PERSONAS_COMUNES: [
    '¿Cuándo empezaste a notar la presión por verte de cierta manera?',
    '¿Cómo influyen las redes sociales o las personas cercanas en la forma en que ves tu cuerpo?',
    '¿Qué te ha ayudado a sentirte más en paz con tu cuerpo?',
    '¿Recuerdas algún comentario sobre tu cuerpo que te haya marcado?',
    '¿Qué le dirías a tu yo de 15 años?',
    '¿Qué te gustaría que cambiara en la forma en que hablamos de los cuerpos?',
  ],
};

type Props = {
  value: InterviewQuestion[];
  onChange: (value: InterviewQuestion[]) => void;
  category: InterviewCategory | '';
  /** Errores de la API: `questions` y `questions.<n>.question|answer`. */
  errors: Record<string, string>;
};

/**
 * Preguntas y respuestas de la entrevista: el equipo agrega las que quiera
 * (en blanco o desde las sugeridas), las ordena y las quita.
 */
export function InterviewQuestionsField({ value, onChange, category, errors }: Props) {
  const id = useId();
  const { confirm } = useFeedback();
  // Claves estables por fila: al reordenar o quitar, cada campo conserva su foco y su texto.
  const keys = useRef<number[]>([]);
  const nextKey = useRef(0);
  if (keys.current.length !== value.length) keys.current = value.map(() => nextKey.current++);

  const focusLater = (elementId: string) => requestAnimationFrame(() => document.getElementById(elementId)?.focus());
  const full = value.length >= MAX_QUESTIONS;

  const add = (question = '') => {
    if (full) return;
    const key = nextKey.current++;
    keys.current = [...keys.current, key];
    onChange([...value, { question, answer: '' }]);
    // Desde una sugerencia, lo que falta es la respuesta; en blanco, la pregunta.
    focusLater(`${id}-${question ? 'a' : 'q'}-${key}`);
  };

  const update = (index: number, patch: Partial<InterviewQuestion>) => onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const move = (index: number, step: -1 | 1) => {
    const target = index + step;
    const swap = <T,>(list: T[]) => list.map((item, i) => (i === index ? list[target] : i === target ? list[index] : item));
    const key = keys.current[index];
    keys.current = swap(keys.current);
    onChange(swap(value));
    // Si llegó al extremo, su botón queda deshabilitado: el foco pasa al otro.
    const atEdge = target === 0 || target === value.length - 1;
    focusLater(`${id}-${atEdge ? (step === -1 ? 'down' : 'up') : step === -1 ? 'up' : 'down'}-${key}`);
  };

  const remove = async (index: number) => {
    const item = value[index];
    if (item.answer.trim()) {
      const ok = await confirm({ title: `¿Quitar la pregunta ${index + 1}?`, message: 'Su respuesta también se quitará de la entrevista.', tone: 'danger', icon: Trash2, confirmLabel: 'Quitar pregunta' });
      if (!ok) return;
    }
    keys.current = keys.current.filter((_, i) => i !== index);
    onChange(value.filter((_, i) => i !== index));
  };

  const suggestions = category ? SUGGESTED_QUESTIONS[category] : [];
  const categoryLabel = INTERVIEW_CATEGORIES.find((c) => c.key === category)?.label;
  const timesUsed = (question: string) => value.filter((item) => item.question.trim() === question).length;

  return (
    <fieldset className="questions-field" aria-describedby={`${id}-hint`}>
      <legend className="field__label">Preguntas y respuestas</legend>
      <p id={`${id}-hint`} className="field__hint">
        Agrega todas las que quieras (hasta {MAX_QUESTIONS}). Puedes guardar el borrador con respuestas pendientes; para publicar, cada pregunta necesita su respuesta.
      </p>

      {value.length ? (
        <ol className="questions-field__list">
          {value.map((item, index) => {
            const key = keys.current[index];
            const n = index + 1;
            return (
              <li key={key} className="questions-field__row">
                <span className="questions-field__n" aria-hidden>{n}</span>
                <div className="stack-sm questions-field__inputs">
                  <TextArea id={`${id}-q-${key}`} label={`Pregunta ${n} *`} rows={2} maxLength={300} value={item.question} onChange={(e) => update(index, { question: e.target.value })} error={errors[`questions.${index}.question`]} />
                  <TextArea id={`${id}-a-${key}`} label={`Respuesta ${n}`} rows={5} maxLength={5000} value={item.answer} onChange={(e) => update(index, { answer: e.target.value })} error={errors[`questions.${index}.answer`]} />
                </div>
                <div className="questions-field__actions">
                  <Button id={`${id}-up-${key}`} variant="ghost" size="sm" icon={ArrowUp} aria-label={`Subir la pregunta ${n}`} disabled={index === 0} onClick={() => move(index, -1)} />
                  <Button id={`${id}-down-${key}`} variant="ghost" size="sm" icon={ArrowDown} aria-label={`Bajar la pregunta ${n}`} disabled={index === value.length - 1} onClick={() => move(index, 1)} />
                  <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Quitar la pregunta ${n}`} onClick={() => remove(index)} />
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="questions-field__empty">Aún no hay preguntas. Escribe una propia o elige una de las sugeridas.</p>
      )}

      {errors.questions ? (
        <span className="field__error" role="alert">
          {errors.questions}
        </span>
      ) : null}

      <Button variant="secondary" icon={Plus} onClick={() => add()} disabled={full} style={{ alignSelf: 'flex-start' }}>
        Agregar pregunta
      </Button>
      {full ? <p className="field__hint">Llegaste al máximo de {MAX_QUESTIONS} preguntas.</p> : null}

      <section className="questions-field__suggestions" aria-labelledby={`${id}-sug`}>
        <h3 id={`${id}-sug`} className="questions-field__sug-title">
          <Lightbulb size={16} aria-hidden /> Preguntas sugeridas{categoryLabel ? ` para ${categoryLabel.toLowerCase()}` : ''}
        </h3>
        {category ? (
          <>
            <p className="field__hint">Haz clic en una para agregarla al final. Puedes usar la misma pregunta las veces que quieras y editarla después.</p>
            <ul className="questions-field__sug-list">
              {suggestions.map((question) => {
                const used = timesUsed(question);
                return (
                  <li key={question}>
                    <button type="button" className="suggestion-chip" onClick={() => add(question)} disabled={full} data-used={used > 0 || undefined}>
                      {used ? <Check size={14} aria-hidden /> : <Plus size={14} aria-hidden />}
                      <span>{question}</span>
                      {used ? <span className="suggestion-chip__count">{used === 1 ? 'Agregada' : `Agregada ${used} veces`}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="field__hint">Elige la categoría de la entrevista para ver preguntas de ejemplo.</p>
        )}
      </section>
    </fieldset>
  );
}

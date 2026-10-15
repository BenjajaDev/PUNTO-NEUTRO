import { ChevronDown, Search, SpellCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { normalize } from '@/lib/format';
import type { GlossaryTerm } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { EmptyState, ErrorState, SkeletonCards } from '@/ui';
import { PageHero } from '../components/Common';

function TermCard({ term, open, onToggle }: { term: GlossaryTerm; open: boolean; onToggle: () => void }) {
  const panelId = `reformulacion-${term.slug}`;
  return (
    <article className="card card--raised term-card" id={term.slug}>
      <h2 className="term-card__term">{term.term}</h2>
      <dl className="term-card__rows">
        <div>
          <dt>Definición común</dt>
          <dd>{term.commonDefinition}</dd>
        </div>
        <div>
          <dt>Sesgo o impacto inconsciente</dt>
          <dd>{term.bias}</dd>
        </div>
      </dl>
      <button type="button" className="term-card__toggle" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        {open ? 'Ocultar reformulación neutra' : 'Ver reformulación neutra'}
        <ChevronDown size={18} aria-hidden className="term-card__chevron" />
      </button>
      <div id={panelId} className="term-card__reveal" data-open={open}>
        <div>
          <div className="term-card__neutral">
            <span className="badge badge--success">Reformulación neutra</span>
            <p>{term.neutralReformulation}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Sección 5 · Glosario interactivo: visibilizar, resignificar y desnaturalizar. */
export function GlossaryPage() {
  const { data, loading, error, reload } = useResource((signal) => api<GlossaryTerm[]>('/glossary', { signal }), []);
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return (data || []).filter((t) => !q || normalize(`${t.term} ${t.commonDefinition} ${t.bias} ${t.neutralReformulation}`).includes(q));
  }, [data, query]);

  const allOpen = filtered.length > 0 && filtered.every((t) => openIds.has(t.id));
  const toggle = (id: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <PageHero
        eyebrow="Glosario de palabras normalizadas"
        title="Las palabras también moldean los cuerpos"
        intro="Un diccionario pedagógico para visibilizar, resignificar y desnaturalizar términos de uso común que refuerzan prejuicios sobre los cuerpos. Lee la definición, piensa en el sesgo y descubre una forma más neutra de decirlo."
      />
      <section className="section section--tight">
        <div className="container stack-lg">
          <div className="toolbar">
            <label className="search">
              <Search size={18} aria-hidden />
              <span className="visually-hidden">Buscar en el glosario</span>
              <input className="input" type="search" placeholder="Buscar un término" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            {filtered.length ? (
              <button type="button" className="chip" aria-pressed={allOpen} onClick={() => setOpenIds(allOpen ? new Set() : new Set(filtered.map((t) => t.id)))}>
                {allOpen ? 'Ocultar todas las reformulaciones' : 'Mostrar todas las reformulaciones'}
              </button>
            ) : null}
          </div>

          {loading ? (
            <SkeletonCards label="Cargando glosario" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !filtered.length ? (
            <EmptyState icon={SpellCheck} title={data?.length ? 'No encontramos ese término' : 'El glosario se está escribiendo'} message={data?.length ? '¿Se te ocurre una palabra que debería estar? Escríbenos desde el Buzón.' : undefined} />
          ) : (
            <div className="grid-3 stagger">
              {filtered.map((term) => (
                <TermCard key={term.id} term={term} open={openIds.has(term.id)} onToggle={() => toggle(term.id)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

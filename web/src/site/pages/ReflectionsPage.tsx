import { ArrowRight, HeartHandshake } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/format';
import { REFLECTION_CATEGORY, type ReflectionCategory, type ReflectionSummary } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { EmptyState, ErrorState, SkeletonCards } from '@/ui';
import { HelpResources, PageHero } from '../components/Common';
import { usePageTitle, useSiteData } from '../SiteDataProvider';

const FILTERS: { key: ReflectionCategory | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Todo' },
  { key: 'TRASTORNOS', label: REFLECTION_CATEGORY.TRASTORNOS },
  { key: 'PREJUICIOS', label: REFLECTION_CATEGORY.PREJUICIOS },
  { key: 'ESTRATEGIAS', label: REFLECTION_CATEGORY.ESTRATEGIAS },
];

export function ReflectionCard({ item }: { item: ReflectionSummary }) {
  const cover = mediaUrl(item.coverId);
  return (
    <article className="card card--raised reflection-card lift">
      {cover ? <img className="reflection-card__cover" src={cover} alt="" loading="lazy" /> : <span className="reflection-card__icon" aria-hidden><HeartHandshake size={22} /></span>}
      <span className="badge">{REFLECTION_CATEGORY[item.category]}</span>
      <h2 className="reflection-card__title">
        <Link to={`/querer-encajar/${item.slug}`} className="stretched-link" viewTransition>
          {item.title}
        </Link>
      </h2>
      <p className="text-secondary">{item.summary}</p>
      <span className="link-arrow" aria-hidden>
        Leer <ArrowRight size={18} />
      </span>
    </article>
  );
}

/** RF-03 · «Querer encajar»: salud mental, prejuicios autogenerados y manejo emocional. */
export function ReflectionsPage() {
  const { settings } = useSiteData();
  usePageTitle('Querer encajar');
  const [category, setCategory] = useState<ReflectionCategory | 'ALL'>('ALL');
  const { data, loading, error, reload } = useResource((signal) => api<ReflectionSummary[]>('/reflections', { signal }), []);
  const filtered = (data || []).filter((r) => category === 'ALL' || r.category === category);

  return (
    <>
      <PageHero eyebrow="Querer encajar" title="Cuando la presión por encajar se instala en la mente" intro={settings?.reflectionsIntro} art="reflections" coverId={settings?.reflectionsCoverId} />
      <section className="section section--tight">
        <div className="container stack-lg">
          <HelpResources />
          <div className="row" role="group" aria-label="Filtrar por tema">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" className="chip" aria-pressed={category === f.key} onClick={() => setCategory(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          {loading ? (
            <SkeletonCards label="Cargando artículos" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !filtered.length ? (
            <EmptyState icon={HeartHandshake} title={data?.length ? 'Aún no hay artículos en este tema' : 'Los primeros artículos vienen en camino'} />
          ) : (
            <div className="grid-3 stagger">
              {filtered.map((item) => (
                <ReflectionCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

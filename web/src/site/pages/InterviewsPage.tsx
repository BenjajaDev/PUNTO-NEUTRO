import { ArrowRight, MessageSquareQuote } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatDate, mediaUrl } from '@/lib/format';
import { INTERVIEW_CATEGORIES, INTERVIEW_CATEGORY_LABEL, type InterviewCategory, type InterviewSummary } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Button, EmptyState, ErrorState, SkeletonCards, tabPanelProps, Tabs } from '@/ui';
import { PageHero } from '../components/Common';
import { usePageTitle, useSiteData } from '../SiteDataProvider';

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

type TabKey = 'TODAS' | InterviewCategory;
const TAB_PREFIX = 'entrevistas';

export function InterviewCard({ item, showCategory = true }: { item: InterviewSummary; showCategory?: boolean }) {
  return (
    <article className="card card--raised interview-card lift">
      <div className="row" style={{ gap: 14 }}>
        {mediaUrl(item.photoId) ? (
          <img className="avatar avatar--lg" src={mediaUrl(item.photoId)!} alt="" width={72} height={72} loading="lazy" />
        ) : (
          <span className="avatar avatar--lg avatar--initials" aria-hidden>
            {initials(item.guestName)}
          </span>
        )}
        <div>
          {showCategory ? <span className="badge interview-card__category">{INTERVIEW_CATEGORY_LABEL[item.category]}</span> : null}
          <h3 className="interview-card__name">
            <Link to={`/entrevistas/${item.slug}`} className="stretched-link" viewTransition>
              {item.guestName}
            </Link>
          </h3>
          <p className="text-muted text-small">{[item.guestHandle, formatDate(item.publishedAt)].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      <blockquote className="interview-card__quote">«{item.firstQuestion}»</blockquote>
      <span className="link-arrow" aria-hidden>
        Leer entrevista <ArrowRight size={18} />
      </span>
    </article>
  );
}

/** Sección 4 · Pequeñas Entrevistas, separadas en Expertas, Influencers y Mujeres. */
export function InterviewsPage() {
  const { data, loading, error, reload } = useResource((signal) => api<InterviewSummary[]>('/interviews', { signal }), []);
  const { settings } = useSiteData();
  usePageTitle('Pequeñas Entrevistas');
  const [params, setParams] = useSearchParams();

  // ?categoria=expertas|influencers|mujeres (legible y compartible).
  const tab: TabKey = INTERVIEW_CATEGORIES.find((c) => c.slug === params.get('categoria'))?.key ?? 'TODAS';
  const setTab = (key: TabKey) => {
    const next = new URLSearchParams(params);
    const slug = INTERVIEW_CATEGORIES.find((c) => c.key === key)?.slug;
    if (slug) next.set('categoria', slug);
    else next.delete('categoria');
    setParams(next, { preventScrollReset: true });
  };

  const byCategory = useMemo(() => {
    const groups = Object.fromEntries(INTERVIEW_CATEGORIES.map((c) => [c.key, [] as InterviewSummary[]])) as Record<InterviewCategory, InterviewSummary[]>;
    (data || []).forEach((item) => groups[item.category]?.push(item));
    return groups;
  }, [data]);

  const tabs = [
    { key: 'TODAS' as TabKey, label: 'Todas', count: data?.length },
    ...INTERVIEW_CATEGORIES.map((c) => ({ key: c.key as TabKey, label: c.label, count: data ? byCategory[c.key].length : undefined })),
  ];
  const current = INTERVIEW_CATEGORIES.find((c) => c.key === tab);

  return (
    <>
      <PageHero
        eyebrow="Pequeñas Entrevistas"
        title="Preguntas simples, conversaciones honestas"
        intro="Expertas, influencers y mujeres responden preguntas sobre el escrutinio sobre los cuerpos, la presión por mantener estéticas hegemónicas y las formas de cuidarse."
        art="interviews"
        coverId={settings?.interviewsCoverId}
      />
      <section className="section section--tight">
        <div className="container stack-lg">
          <Tabs tabs={tabs} value={tab} onChange={setTab} idPrefix={TAB_PREFIX} label="Categorías de entrevistas" />

          <div {...tabPanelProps(TAB_PREFIX, tab)} className="tab-panel">
            {loading ? (
              <SkeletonCards label="Cargando entrevistas" />
            ) : error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : !data?.length ? (
              <EmptyState icon={MessageSquareQuote} title="Las primeras entrevistas vienen en camino" message="Mientras tanto, revisa la Anatomía de un Trend o escucha el podcast." />
            ) : current ? (
              // Una categoría: su descripción y sus entrevistas.
              <div className="stack-lg">
                <p className="interview-section__intro">{current.description}</p>
                {byCategory[current.key].length ? (
                  <div className="grid-2 stagger">
                    {byCategory[current.key].map((item) => (
                      <InterviewCard key={item.id} item={item} showCategory={false} />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={MessageSquareQuote} title={`Pronto publicaremos entrevistas a ${current.label.toLowerCase()}`} action={<Button variant="secondary" onClick={() => setTab('TODAS')}>Ver todas las entrevistas</Button>} />
                )}
              </div>
            ) : (
              // «Todas»: agrupadas por sección, en el orden de las pestañas.
              <div className="stack-lg">
                {INTERVIEW_CATEGORIES.filter((c) => byCategory[c.key].length).map((c) => (
                  <section key={c.key} className="interview-section" aria-labelledby={`seccion-${c.slug}`}>
                    <div className="interview-section__head">
                      <div>
                        <h2 id={`seccion-${c.slug}`} className="interview-section__title">
                          {c.label}
                        </h2>
                        <p className="interview-section__intro">{c.description}</p>
                      </div>
                      {byCategory[c.key].length > 2 ? (
                        <button type="button" className="link-arrow interview-section__more" onClick={() => setTab(c.key)}>
                          Ver las {byCategory[c.key].length} <ArrowRight size={18} aria-hidden />
                        </button>
                      ) : null}
                    </div>
                    <div className="grid-2">
                      {byCategory[c.key].slice(0, 2).map((item) => (
                        <InterviewCard key={item.id} item={item} showCategory={false} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

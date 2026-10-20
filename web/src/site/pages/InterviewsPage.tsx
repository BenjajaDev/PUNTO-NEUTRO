import { ArrowRight, MessageSquareQuote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatDate, mediaUrl } from '@/lib/format';
import type { Interview } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { EmptyState, ErrorState, SkeletonCards } from '@/ui';
import { PageHero } from '../components/Common';
import { usePageTitle, useSiteData } from '../SiteDataProvider';

export const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Sección 4 · Pequeñas Entrevistas: formato fijo de tres preguntas. */
export function InterviewsPage() {
  const { data, loading, error, reload } = useResource((signal) => api<Interview[]>('/interviews', { signal }), []);
  const { settings } = useSiteData();
  usePageTitle('Pequeñas Entrevistas');
  return (
    <>
      <PageHero
        eyebrow="Pequeñas Entrevistas"
        title="Tres preguntas, una conversación honesta"
        intro="Creadoras de contenido e influencers digitales chilenas cuentan cómo viven el escrutinio público, la presión por mantener estéticas hegemónicas y las herramientas de autocuidado que usan para gestionar la exposición."
        art="interviews"
        coverId={settings?.interviewsCoverId}
      />
      <section className="section section--tight">
        <div className="container">
          {loading ? (
            <SkeletonCards label="Cargando entrevistas" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.length ? (
            <EmptyState icon={MessageSquareQuote} title="Las primeras entrevistas vienen en camino" message="Mientras tanto, revisa la Anatomía de un Trend o escucha el podcast." />
          ) : (
            <div className="grid-2 stagger">
              {data.map((item) => (
                <article key={item.id} className="card card--raised interview-card lift">
                  <div className="row" style={{ gap: 14 }}>
                    {mediaUrl(item.photoId) ? (
                      <img className="avatar avatar--lg" src={mediaUrl(item.photoId)!} alt="" width={72} height={72} loading="lazy" />
                    ) : (
                      <span className="avatar avatar--lg avatar--initials" aria-hidden>{initials(item.guestName)}</span>
                    )}
                    <div>
                      <h2 className="interview-card__name">
                        <Link to={`/entrevistas/${item.slug}`} className="stretched-link" viewTransition>{item.guestName}</Link>
                      </h2>
                      <p className="text-muted text-small">{[item.guestHandle, formatDate(item.publishedAt)].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                  <blockquote className="interview-card__quote">«{item.question1}»</blockquote>
                  <span className="link-arrow" aria-hidden>Leer entrevista <ArrowRight size={18} /></span>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

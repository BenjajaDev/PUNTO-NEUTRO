import { ArrowLeft, Brain, Clock, Link2, Radar, Scale, Sprout } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { formatDate, readingTime } from '@/lib/format';
import { PLATFORM_LABEL, type Trend } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Button, EmptyState, ErrorState, Skeleton, useFeedback } from '@/ui';
import { Prose } from '../components/Common';
import { TrendCard, TrendCover } from '../components/TrendCard';
import { NotFoundPage } from './NotFoundPage';

// Estructura fija de cada nota (propuesta, sección 3).
const PARTS = [
  { key: 'origin', letter: 'a', title: 'Origen y viralización', icon: Sprout },
  { key: 'mechanism', letter: 'b', title: 'Mecanismo algorítmico y de comparación', icon: Radar },
  { key: 'impact', letter: 'c', title: 'Impacto psicológico y autoobjetivación', icon: Brain },
  { key: 'neutralView', letter: 'd', title: 'Mirada desde la neutralidad corporal', icon: Scale },
] as const;

export function TrendDetailPage() {
  const { slug = '' } = useParams();
  const { notify } = useFeedback();
  const { data: trend, loading, error, reload } = useResource((signal) => api<Trend>(`/trends/${slug}`, { signal }), [slug]);

  if (loading) {
    return (
      <div className="container section stack" role="status" aria-label="Cargando nota">
        <Skeleton width="20%" />
        <Skeleton width="80%" height={48} />
        <Skeleton height={320} radius={16} />
      </div>
    );
  }
  if (error) return error.includes('no existe') ? <NotFoundPage /> : <div className="container section"><ErrorState message={error} onRetry={reload} /></div>;
  if (!trend) return <EmptyState icon={Sprout} title="Nota no encontrada" />;

  const minutes = readingTime(trend.origin, trend.mechanism, trend.impact, trend.neutralView);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify({ tone: 'success', message: 'Enlace copiado. ¡Gracias por compartir!' });
    } catch (err) {
      notify({ tone: 'warning', message: err instanceof ApiError ? err.message : 'No pudimos copiar el enlace. Cópialo desde la barra del navegador.' });
    }
  };

  return (
    <article className="article">
      <header className="article__header container">
        <Link to="/anatomia-de-un-trend" className="link-arrow link-arrow--back" viewTransition>
          <ArrowLeft size={18} aria-hidden /> Anatomía de un Trend
        </Link>
        <div className="row" style={{ gap: 8 }}>
          <span className="badge">{PLATFORM_LABEL[trend.platform]}</span>
          {trend.tags.map((tag) => (
            <span key={tag} className="badge badge--neutral">{tag}</span>
          ))}
        </div>
        <h1 className="article__title">{trend.title}</h1>
        <p className="article__summary">{trend.summary}</p>
        <div className="article__meta">
          {trend.author?.name ? <span>Por {trend.author.name}</span> : null}
          {trend.publishedAt ? <time dateTime={trend.publishedAt}>{formatDate(trend.publishedAt)}</time> : null}
          <span className="row" style={{ gap: 6 }}><Clock size={15} aria-hidden /> {minutes} min de lectura</span>
          <Button variant="ghost" size="sm" icon={Link2} onClick={share}>Copiar enlace</Button>
        </div>
      </header>

      <div className="container">
        <TrendCover trend={trend} large />
      </div>

      <div className="container article__layout">
        <nav className="article__toc" aria-label="En esta nota">
          <p className="article__toc-title">En esta nota</p>
          <ol>
            {PARTS.map((part) => (
              <li key={part.key}>
                <a href={`#${part.key}`}>
                  <span aria-hidden>{part.letter}.</span> {part.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="article__body">
          {PARTS.map(({ key, letter, title, icon: Icon }) => (
            <section key={key} id={key} className={`article__part reveal${key === 'neutralView' ? ' article__part--neutral' : ''}`} aria-labelledby={`${key}-title`}>
              <div className="article__part-head">
                <span className="article__part-icon"><Icon size={20} aria-hidden /></span>
                <h2 id={`${key}-title`}>
                  <span className="article__letter">{letter}.</span> {title}
                </h2>
              </div>
              <Prose text={trend[key]} />
            </section>
          ))}
        </div>
      </div>

      {trend.related?.length ? (
        <aside className="section section--tinted" aria-labelledby="relacionadas">
          <div className="container stack-lg">
            <h2 id="relacionadas" className="section-heading__title">Sigue leyendo</h2>
            <div className="grid-3">
              {trend.related.map((t) => (
                <TrendCard key={t.id} trend={{ ...t, tags: [], status: 'PUBLISHED', updatedAt: t.publishedAt || '' }} />
              ))}
            </div>
          </div>
        </aside>
      ) : null}
    </article>
  );
}

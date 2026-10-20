import { ArrowLeft, Lightbulb } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatDate, mediaUrl, readingTime } from '@/lib/format';
import { REFLECTION_CATEGORY, type Reflection } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { ErrorState, Skeleton } from '@/ui';
import { AuthorCard, CapsuleLink, EverydayExample, HelpResources, Prose, ReferencesList } from '../components/Common';
import { SectionArt } from '../components/SectionArt';
import { usePageTitle } from '../SiteDataProvider';
import { NotFoundPage } from './NotFoundPage';
import { ReflectionCard } from './ReflectionsPage';

export function ReflectionDetailPage() {
  const { slug = '' } = useParams();
  const { data, loading, error, reload } = useResource((signal) => api<Reflection>(`/reflections/${slug}`, { signal }), [slug]);
  usePageTitle(data?.title ?? 'Querer encajar');

  if (loading) {
    return (
      <div className="container section stack" role="status" aria-label="Cargando artículo">
        <Skeleton width="20%" />
        <Skeleton width="80%" height={48} />
        <Skeleton height={240} radius={16} />
      </div>
    );
  }
  if (error) return error.includes('no existe') ? <NotFoundPage /> : <div className="container section"><ErrorState message={error} onRetry={reload} /></div>;
  if (!data) return <NotFoundPage />;

  const cover = mediaUrl(data.coverId);

  return (
    <article className="article">
      <header className="article__header container">
        <Link to="/querer-encajar" className="link-arrow link-arrow--back" viewTransition>
          <ArrowLeft size={18} aria-hidden /> Querer encajar
        </Link>
        <span className="badge" style={{ alignSelf: 'flex-start' }}>{REFLECTION_CATEGORY[data.category]}</span>
        <h1 className="article__title">{data.title}</h1>
        <p className="article__summary">{data.summary}</p>
        <AuthorCard author={data.authorMember} />
        <div className="article__meta">
          {data.publishedAt ? <time dateTime={data.publishedAt}>{formatDate(data.publishedAt)}</time> : null}
          <span>{readingTime(data.body)} min de lectura</span>
        </div>
      </header>

      <div className="container">
        {cover ? <img className="cover cover--large" src={cover} alt="" /> : <div className="cover cover--large cover--art" aria-hidden><SectionArt kind="reflections" /></div>}
      </div>

      <div className="container article__layout">
        <aside className="stack">
          {data.keyIdeas.length ? (
            <section className="key-ideas" aria-labelledby="ideas-clave">
              <h2 id="ideas-clave" className="key-ideas__title">
                <Lightbulb size={18} aria-hidden /> Ideas clave
              </h2>
              <ul>
                {data.keyIdeas.map((idea) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <HelpResources compact />
        </aside>
        <div className="article__body">
          <Prose text={data.body} className="prose--article" />
          <EverydayExample text={data.everydayExample} />
          <CapsuleLink url={data.capsuleUrl} />
          <ReferencesList references={data.references} />
          <p className="text-small text-muted">Este contenido es educativo y no reemplaza la atención de profesionales de la salud.</p>
        </div>
      </div>

      {data.related?.length ? (
        <aside className="section section--tinted" aria-labelledby="relacionados">
          <div className="container stack-lg">
            <h2 id="relacionados" className="section-heading__title">Sigue leyendo</h2>
            <div className="grid-3">
              {data.related.map((item) => (
                <ReflectionCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </aside>
      ) : null}
    </article>
  );
}

import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatDate, mediaUrl } from '@/lib/format';
import type { Interview } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { ErrorState, Skeleton } from '@/ui';
import { Prose } from '../components/Common';
import { initials } from './InterviewsPage';
import { NotFoundPage } from './NotFoundPage';
import { usePageTitle } from '../SiteDataProvider';

export function InterviewDetailPage() {
  const { slug = '' } = useParams();
  const { data, loading, error, reload } = useResource((signal) => api<Interview>(`/interviews/${slug}`, { signal }), [slug]);
  usePageTitle(data ? `Entrevista a ${data.guestName}` : 'Pequeñas Entrevistas');

  if (loading) {
    return (
      <div className="container section stack" role="status" aria-label="Cargando entrevista">
        <Skeleton width={96} height={96} radius={48} />
        <Skeleton width="60%" height={40} />
        <Skeleton height={200} radius={16} />
      </div>
    );
  }
  if (error) return error.includes('no existe') ? <NotFoundPage /> : <div className="container section"><ErrorState message={error} onRetry={reload} /></div>;
  if (!data) return <NotFoundPage />;

  const qa = [
    [data.question1, data.answer1],
    [data.question2, data.answer2],
    [data.question3, data.answer3],
  ];

  return (
    <article className="article">
      <header className="container interview-hero">
        <Link to="/entrevistas" className="link-arrow link-arrow--back" viewTransition>
          <ArrowLeft size={18} aria-hidden /> Pequeñas Entrevistas
        </Link>
        {mediaUrl(data.photoId) ? (
          <img className="avatar avatar--xl" src={mediaUrl(data.photoId)!} alt={`Retrato de ${data.guestName}`} width={120} height={120} />
        ) : (
          <span className="avatar avatar--xl avatar--initials" aria-hidden>{initials(data.guestName)}</span>
        )}
        <h1 className="article__title">{data.guestName}</h1>
        <p className="text-muted">{[data.guestHandle, data.publishedAt && formatDate(data.publishedAt), data.author?.name && `Entrevista: ${data.author.name}`].filter(Boolean).join(' · ')}</p>
        {data.guestBio ? <p className="article__summary">{data.guestBio}</p> : null}
      </header>
      <div className="container reading stack-lg">
        {data.intro ? <Prose text={data.intro} className="prose--lead" /> : null}
        <ol className="qa">
          {qa.map(([q, a], i) => (
            <li key={i} className="qa__item reveal">
              <p className="qa__number" aria-hidden>{i + 1}</p>
              <h2 className="qa__question">{q}</h2>
              <Prose text={a} />
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

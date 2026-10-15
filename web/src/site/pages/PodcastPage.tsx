import { ExternalLink, Headphones } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { PodcastEpisode } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { buttonClass, EmptyState, ErrorState, SkeletonRows } from '@/ui';
import { PageHero } from '../components/Common';
import { SoundCloudPlayer } from '../components/SoundCloudPlayer';
import { useSiteData } from '../SiteDataProvider';

/** Sección 7 · Podcast «A Pausar el Filtro» con reproductor de SoundCloud. */
export function PodcastPage() {
  const { settings } = useSiteData();
  const { data, loading, error, reload } = useResource((signal) => api<PodcastEpisode[]>('/podcast', { signal }), []);
  const profile = settings?.soundcloudProfile;

  return (
    <>
      <PageHero eyebrow="Podcast" title={settings?.podcastName || 'A Pausar el Filtro'} intro={settings?.podcastDescription}>
        {profile ? (
          <a href={profile} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'secondary', className: 'page-hero__action' })}>
            Seguir en SoundCloud <ExternalLink size={16} aria-hidden />
            <span className="visually-hidden">(se abre en otra pestaña)</span>
          </a>
        ) : null}
      </PageHero>
      <section className="section section--tight">
        <div className="container reading">
          {loading ? (
            <SkeletonRows rows={3} label="Cargando episodios" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.length ? (
            <EmptyState icon={Headphones} title="El primer episodio viene en camino" message="Conversaciones con especialistas en psicología, salud y comunicación, en un lenguaje cercano y sin tecnicismos." />
          ) : (
            <ol className="episodes stagger">
              {data.map((ep) => (
                <li key={ep.id} className="card card--raised episode">
                  <div className="row-between">
                    <span className="badge">{ep.number ? `Episodio ${ep.number}` : 'Episodio'}</span>
                    <span className="text-muted text-small">{[ep.durationMin && `${ep.durationMin} min`, formatDate(ep.publishedAt)].filter(Boolean).join(' · ')}</span>
                  </div>
                  <h2 className="episode__title">{ep.title}</h2>
                  {ep.guests ? <p className="text-small"><strong>Con:</strong> {ep.guests}</p> : null}
                  {ep.description ? <p className="text-secondary">{ep.description}</p> : null}
                  <SoundCloudPlayer url={ep.soundcloudUrl} title={ep.title} />
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}

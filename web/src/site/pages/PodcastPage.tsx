import { ExternalLink, Headphones, X } from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { tagKey } from '@/lib/soundcloud';
import type { PodcastEpisode } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Button, buttonClass, EmptyState, ErrorState, SkeletonCards } from '@/ui';
import { PageHero } from '../components/Common';
import { PodcastCard } from '../components/PodcastCard';
import { usePageTitle, useSiteData } from '../SiteDataProvider';

/** Palabras clave de todos los episodios, sin duplicados, de la más usada a la menos usada. */
function collectTags(episodes: PodcastEpisode[]) {
  const counts = new Map<string, { tag: string; count: number }>();
  for (const ep of episodes) {
    for (const tag of ep.tags) {
      const key = tagKey(tag);
      const entry = counts.get(key) ?? { tag, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'es'));
}

/** Sección 7 · Podcast «A Pausar el Filtro»: tarjetas de episodios con enlace a SoundCloud. */
export function PodcastPage() {
  const { settings } = useSiteData();
  usePageTitle('Podcast');
  const [params, setParams] = useSearchParams();
  const activeTag = params.get('tema');
  const { data, loading, error, reload } = useResource((signal) => api<PodcastEpisode[]>('/podcast', { signal }), []);
  const profile = settings?.soundcloudProfile;

  const tags = useMemo(() => collectTags(data || []), [data]);
  const visible = useMemo(() => {
    if (!activeTag) return data || [];
    const key = tagKey(activeTag);
    return (data || []).filter((ep) => ep.tags.some((t) => tagKey(t) === key));
  }, [data, activeTag]);

  // El filtro vive en la URL (?tema=…): se puede compartir y el botón «atrás» funciona.
  const setTag = (tag: string | null) => {
    const next = new URLSearchParams(params);
    if (!tag || (activeTag && tagKey(activeTag) === tagKey(tag))) next.delete('tema');
    else next.set('tema', tag);
    setParams(next, { preventScrollReset: true });
  };

  return (
    <>
      <PageHero eyebrow="Podcast" title={settings?.podcastName || 'A Pausar el Filtro'} intro={settings?.podcastDescription} art="podcast" coverId={settings?.podcastCoverId}>
        {profile ? (
          <a href={profile} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'secondary', className: 'page-hero__action' })}>
            Seguir en SoundCloud <ExternalLink size={16} aria-hidden />
            <span className="visually-hidden">(se abre en otra pestaña)</span>
          </a>
        ) : null}
      </PageHero>
      <section className="section section--tight">
        <div className="container stack-lg">
          {tags.length ? (
            <div className="stack-sm">
              <p className="podcast-filter__label" id="filtro-temas">Filtrar por tema</p>
              <div className="row" role="group" aria-labelledby="filtro-temas">
                <button type="button" className="chip" aria-pressed={!activeTag} onClick={() => setTag(null)}>
                  Todos
                </button>
                {tags.map(({ tag, count }) => (
                  <button key={tag} type="button" className="chip" aria-pressed={Boolean(activeTag) && tagKey(activeTag!) === tagKey(tag)} onClick={() => setTag(tag)}>
                    #{tag} <span className="chip__count">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {loading ? (
            <SkeletonCards count={3} label="Cargando episodios" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.length ? (
            <EmptyState icon={Headphones} title="El primer episodio viene en camino" message="Conversaciones con especialistas en psicología, salud y comunicación, en un lenguaje cercano y sin tecnicismos." />
          ) : !visible.length ? (
            <EmptyState icon={Headphones} title={`No hay episodios sobre «${activeTag}»`} action={<Button variant="secondary" icon={X} onClick={() => setTag(null)}>Ver todos los episodios</Button>} />
          ) : (
            <>
              <p className="text-muted text-small" aria-live="polite">
                {visible.length === 1 ? '1 episodio' : `${visible.length} episodios`}
                {activeTag ? ` sobre «${activeTag}»` : ''}
              </p>
              <div className="podcast-grid stagger">
                {visible.map((ep) => (
                  <PodcastCard key={ep.id} episode={ep} onTagClick={setTag} activeTag={activeTag} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

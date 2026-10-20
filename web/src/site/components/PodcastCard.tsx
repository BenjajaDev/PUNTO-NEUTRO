import { ExternalLink, Headphones, Play, X } from 'lucide-react';
import { useId, useState } from 'react';
import { formatDate, mediaUrl } from '@/lib/format';
import { tagKey } from '@/lib/soundcloud';
import type { PodcastEpisode } from '@/lib/types';
import { SectionArt } from './SectionArt';
import { SoundCloudPlayer } from './SoundCloudPlayer';

/** Lo mínimo que necesita la tarjeta (sirve también para la vista previa del panel). */
export type PodcastCardData = Pick<PodcastEpisode, 'title' | 'summary' | 'tags' | 'coverId' | 'soundcloudUrl'> &
  Partial<Pick<PodcastEpisode, 'id' | 'number' | 'durationMin' | 'publishedAt' | 'guests'>>;

type Props = {
  episode: PodcastCardData;
  /** Si se pasa, las palabras clave son botones que filtran (página Podcast). */
  onTagClick?: (tag: string) => void;
  activeTag?: string | null;
  /** Nivel del título según dónde se use la tarjeta (h2 en Podcast, h3 en la portada). */
  headingLevel?: 2 | 3;
  /** Vista previa en el panel: sin reproductor ni enlaces activos. */
  preview?: boolean;
};

/**
 * Tarjeta de episodio: carátula, título, resumen, palabras clave y enlace
 * directo a SoundCloud. El reproductor se carga recién cuando alguien pide
 * escuchar aquí: no se descarga un iframe de SoundCloud por cada tarjeta.
 */
export function PodcastCard({ episode, onTagClick, activeTag, headingLevel = 2, preview = false }: Props) {
  const [playing, setPlaying] = useState(false);
  const playerId = useId();
  const cover = mediaUrl(episode.coverId);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const meta = [episode.number ? `Episodio ${episode.number}` : null, episode.durationMin ? `${episode.durationMin} min` : null, formatDate(episode.publishedAt)].filter(Boolean);

  return (
    <article className="podcast-card card card--raised">
      <div className="podcast-card__media">
        {cover ? (
          <img src={cover} alt="" loading="lazy" decoding="async" width={600} height={600} />
        ) : (
          <div className="podcast-card__placeholder" aria-hidden>
            <SectionArt kind="podcast" />
          </div>
        )}
      </div>

      <div className="podcast-card__body">
        {meta.length ? <p className="podcast-card__meta">{meta.join(' · ')}</p> : null}
        <Heading className="podcast-card__title">{episode.title || 'Título del episodio'}</Heading>
        {episode.guests ? <p className="podcast-card__guests">Con {episode.guests}</p> : null}
        <p className="podcast-card__summary">{episode.summary || 'Aquí va el resumen del episodio.'}</p>

        {episode.tags.length ? (
          <ul className="podcast-card__tags" aria-label="Palabras clave">
            {episode.tags.map((tag) => (
              <li key={tag}>
                {onTagClick && !preview ? (
                  <button type="button" className="tag-chip" aria-pressed={Boolean(activeTag) && tagKey(activeTag!) === tagKey(tag)} onClick={() => onTagClick(tag)} title={`Ver episodios sobre «${tag}»`}>
                    #{tag}
                  </button>
                ) : (
                  <span className="tag-chip">#{tag}</span>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="podcast-card__actions">
          {preview ? (
            <span className="btn btn--sm" aria-hidden>
              <Headphones size={16} /> Escuchar en SoundCloud
            </span>
          ) : (
            <>
              <a className="btn btn--sm" href={episode.soundcloudUrl} target="_blank" rel="noopener noreferrer" aria-label={`Escuchar «${episode.title}» en SoundCloud (se abre en otra pestaña)`}>
                <Headphones size={16} aria-hidden /> Escuchar en SoundCloud <ExternalLink size={14} aria-hidden />
              </a>
              <button type="button" className="btn btn--ghost btn--sm" aria-expanded={playing} aria-controls={playerId} onClick={() => setPlaying((v) => !v)}>
                {playing ? <X size={16} aria-hidden /> : <Play size={16} aria-hidden />} {playing ? 'Cerrar reproductor' : 'Escuchar aquí'}
              </button>
            </>
          )}
        </div>
        <div id={playerId}>{playing ? <SoundCloudPlayer url={episode.soundcloudUrl} title={episode.title} /> : null}</div>
      </div>
    </article>
  );
}

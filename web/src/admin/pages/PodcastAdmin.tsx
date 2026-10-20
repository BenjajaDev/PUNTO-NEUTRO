import { Headphones } from 'lucide-react';
import { formatDate, mediaUrl } from '@/lib/format';
import { MAX_TAG_LENGTH, MAX_TAGS, normalizeSoundcloudUrl } from '@/lib/soundcloud';
import type { PodcastEpisode } from '@/lib/types';
import { PodcastCard } from '@/site/components/PodcastCard';
import { Badge } from '@/ui';
import { CrudDialogPage } from '../components/CrudDialogPage';

// Sin id: el formulario sabe que es un episodio nuevo.
const empty = {
  number: null,
  title: '',
  summary: '',
  tags: [],
  coverId: null,
  guests: '',
  soundcloudUrl: '',
  durationMin: null,
  published: false,
  publishedAt: null,
} as unknown as PodcastEpisode;

/** El mismo validador que usa la API: avisa antes de enviar. */
const validateSoundcloud = (value: unknown) => {
  if (!String(value ?? '').trim()) return undefined; // «obligatorio» lo cubre `required`
  const result = normalizeSoundcloudUrl(String(value));
  return result.ok ? undefined : result.error;
};

const validateTags = (value: unknown) => ((value as string[]).some((t) => t.replace(/^#+/, '').trim().length > MAX_TAG_LENGTH) ? `Cada palabra clave puede tener hasta ${MAX_TAG_LENGTH} caracteres.` : undefined);

/** CRUD de las tarjetas del podcast «A Pausar el Filtro». */
export function PodcastAdmin() {
  return (
    <CrudDialogPage<PodcastEpisode>
      title="Podcast «A Pausar el Filtro»"
      subtitle="Tarjetas de episodios: carátula, título, resumen, palabras clave y enlace directo a SoundCloud."
      icon={Headphones}
      itemName="Episodio"
      endpoint="/admin/podcast"
      empty={empty}
      describe={(e) => e.title}
      searchText={(e) => `${e.title} ${e.guests} ${e.summary} ${e.tags.join(' ')}`}
      fields={[
        { key: 'title', label: 'Título', required: true, maxLength: 160, full: true },
        { key: 'soundcloudUrl', label: 'Enlace de SoundCloud', type: 'url', required: true, full: true, placeholder: 'https://soundcloud.com/…', hint: 'En SoundCloud: Compartir → Copiar enlace. Se guarda limpio, sin los datos de rastreo.', validate: validateSoundcloud },
        { key: 'summary', label: 'Resumen', type: 'textarea', required: true, maxLength: 600, hint: 'Dos o tres frases que inviten a escuchar. Se muestra en la tarjeta.' },
        { key: 'tags', label: 'Palabras clave', type: 'list', max: MAX_TAGS, placeholder: 'Ej. Salud mental', hint: `Escribe y presiona Enter. Hasta ${MAX_TAGS}; en el sitio sirven para filtrar episodios.`, validate: validateTags },
        { key: 'coverId', label: 'Carátula', type: 'image', hint: 'Cuadrada, mínimo 600 × 600 px. Sin carátula se usa la ilustración del podcast.' },
        { key: 'number', label: 'N° de episodio', type: 'number' },
        { key: 'durationMin', label: 'Duración (minutos)', type: 'number' },
        { key: 'guests', label: 'Invitadas e invitados', maxLength: 300, full: true },
        { key: 'published', label: 'Publicado', type: 'switch', hint: 'Solo los episodios publicados aparecen en el sitio.', full: true },
      ]}
      preview={(e) => <PodcastCard episode={e} preview headingLevel={3} />}
      columns={[
        {
          label: 'Episodio',
          render: (e) => (
            <span className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
              {mediaUrl(e.coverId) ? <img src={mediaUrl(e.coverId)!} alt="" width={44} height={44} style={{ borderRadius: 8, objectFit: 'cover' }} /> : <span className="admin-thumb" aria-hidden><Headphones size={18} /></span>}
              <span>
                <strong>{e.title}</strong>
                <span className="text-xs text-muted" style={{ display: 'block' }}>{[e.number ? `N° ${e.number}` : null, e.durationMin ? `${e.durationMin} min` : null].filter(Boolean).join(' · ') || '—'}</span>
              </span>
            </span>
          ),
        },
        { label: 'Palabras clave', render: (e) => (e.tags.length ? <span className="row" style={{ gap: 4 }}>{e.tags.map((t) => <Badge key={t} tone="neutral">#{t}</Badge>)}</span> : <span className="text-muted">—</span>) },
        { label: 'Publicado', render: (e) => (e.published ? formatDate(e.publishedAt) : '—') },
        { label: 'Estado', render: (e) => (e.published ? <Badge tone="success">Publicado</Badge> : <Badge tone="warning">Borrador</Badge>) },
      ]}
    />
  );
}

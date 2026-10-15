import { Headphones } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { PodcastEpisode } from '@/lib/types';
import { Badge } from '@/ui';
import { CrudDialogPage } from '../components/CrudDialogPage';

const empty = { title: '', number: null, description: '', guests: '', soundcloudUrl: '', durationMin: null, published: false } as unknown as PodcastEpisode;

export function PodcastAdmin() {
  return (
    <CrudDialogPage<PodcastEpisode>
      title="Podcast «A Pausar el Filtro»"
      subtitle="Episodios con reproductor embebido de SoundCloud."
      icon={Headphones}
      itemName="Episodio"
      endpoint="/admin/podcast"
      empty={empty}
      describe={(e) => e.title}
      searchText={(e) => `${e.title} ${e.guests} ${e.description}`}
      fields={[
        { key: 'title', label: 'Título', required: true, maxLength: 160, full: true },
        { key: 'number', label: 'N° de episodio', type: 'number' },
        { key: 'durationMin', label: 'Duración (minutos)', type: 'number' },
        { key: 'soundcloudUrl', label: 'Enlace de SoundCloud', type: 'url', required: true, full: true, hint: 'Copia el enlace del episodio desde SoundCloud (https://soundcloud.com/…).' },
        { key: 'guests', label: 'Invitadas e invitados', maxLength: 300, full: true },
        { key: 'description', label: 'Descripción', type: 'textarea', maxLength: 2000 },
        { key: 'published', label: 'Publicado', type: 'switch', hint: 'Solo los episodios publicados aparecen en el sitio.', full: true },
      ]}
      columns={[
        { label: 'N°', render: (e) => e.number ?? '—' },
        { label: 'Título', render: (e) => <strong>{e.title}</strong> },
        { label: 'Publicado', render: (e) => (e.published ? formatDate(e.publishedAt) : '—') },
        { label: 'Estado', render: (e) => (e.published ? <Badge tone="success">Publicado</Badge> : <Badge tone="warning">Borrador</Badge>) },
      ]}
    />
  );
}

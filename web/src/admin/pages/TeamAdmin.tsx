import { Users } from 'lucide-react';
import { mediaUrl } from '@/lib/format';
import type { TeamMember } from '@/lib/types';
import { Badge } from '@/ui';
import { CrudDialogPage } from '../components/CrudDialogPage';

const empty = { name: '', role: '', bio: '', responsibilities: [], photoId: null, order: 0, published: true } as unknown as TeamMember;

export function TeamAdmin() {
  return (
    <CrudDialogPage<TeamMember>
      title="Equipo (Nosotras)"
      subtitle="Integrantes, roles y responsabilidades editoriales."
      icon={Users}
      itemName="Integrante"
      endpoint="/admin/team"
      empty={empty}
      describe={(m) => m.name}
      searchText={(m) => `${m.name} ${m.role}`}
      fields={[
        { key: 'name', label: 'Nombre', required: true, maxLength: 120 },
        { key: 'role', label: 'Rol', required: true, maxLength: 160 },
        { key: 'photoId', label: 'Foto', type: 'image', hint: 'Retrato cuadrado, idealmente 400×400 px.' },
        { key: 'order', label: 'Orden', type: 'number' },
        { key: 'bio', label: 'Biografía breve', type: 'textarea', maxLength: 2000 },
        { key: 'responsibilities', label: 'Responsabilidades', type: 'list' },
        { key: 'published', label: 'Visible en el sitio', type: 'switch', full: true },
      ]}
      columns={[
        { label: 'Integrante', render: (m) => (
          <span className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
            {mediaUrl(m.photoId) ? <img src={mediaUrl(m.photoId)!} alt="" width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover' }} /> : null}
            <strong>{m.name}</strong>
          </span>
        ) },
        { label: 'Rol', render: (m) => <span className="text-secondary">{m.role}</span> },
        { label: 'Orden', render: (m) => m.order },
        { label: 'Estado', render: (m) => (m.published ? <Badge tone="success">Visible</Badge> : <Badge tone="neutral">Oculto</Badge>) },
      ]}
    />
  );
}

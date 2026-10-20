import { SpellCheck } from 'lucide-react';
import type { GlossaryTerm } from '@/lib/types';
import { Badge } from '@/ui';
import { CrudDialogPage } from '../components/CrudDialogPage';

const empty = { term: '', commonDefinition: '', bias: '', neutralReformulation: '', example: '', order: 0, published: true } as GlossaryTerm;

export function GlossaryAdmin() {
  return (
    <CrudDialogPage<GlossaryTerm>
      title="Glosario de palabras normalizadas"
      subtitle="Término, definición común, sesgo o impacto inconsciente y reformulación neutra."
      icon={SpellCheck}
      itemName="Término"
      endpoint="/admin/glossary"
      empty={empty}
      describe={(t) => t.term}
      searchText={(t) => `${t.term} ${t.commonDefinition} ${t.bias} ${t.neutralReformulation}`}
      fields={[
        { key: 'term', label: 'Término', required: true, maxLength: 120 },
        { key: 'order', label: 'Orden', type: 'number', hint: 'Menor número aparece primero.' },
        { key: 'commonDefinition', label: 'Definición común', type: 'textarea', required: true, maxLength: 1500 },
        { key: 'bias', label: 'Sesgo / impacto inconsciente', type: 'textarea', required: true, maxLength: 1500 },
        { key: 'neutralReformulation', label: 'Reformulación neutra', type: 'textarea', required: true, maxLength: 1500 },
        { key: 'example', label: 'Ejemplo cotidiano (cómo suena en el día a día)', type: 'textarea', maxLength: 600, hint: 'Ej.: En la once familiar: «¿Ya estás preparando el cuerpo para el verano?»' },
        { key: 'published', label: 'Visible en el sitio', type: 'switch', full: true },
      ]}
      columns={[
        { label: 'Término', render: (t) => <strong>{t.term}</strong> },
        { label: 'Reformulación neutra', render: (t) => <span className="text-secondary clamp-2">{t.neutralReformulation}</span> },
        { label: 'Orden', render: (t) => t.order },
        { label: 'Estado', render: (t) => (t.published ? <Badge tone="success">Visible</Badge> : <Badge tone="neutral">Oculto</Badge>) },
      ]}
    />
  );
}

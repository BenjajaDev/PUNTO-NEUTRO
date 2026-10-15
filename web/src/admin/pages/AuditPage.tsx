import { History } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { AuditEntry } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { EmptyState, ErrorState, PageHeader, SkeletonRows } from '@/ui';

const ENTITY: Record<string, string> = {
  trend: 'la nota', interview: 'la entrevista', glossary: 'el término', podcast: 'el episodio', team: 'a la integrante',
  settings: 'la configuración del sitio', media: 'la imagen', user: 'la cuenta', mailbox: 'el relato',
};
const ACTION: Record<string, string> = {
  create: 'creó', update: 'editó', delete: 'eliminó', 'mailbox:approved': 'publicó un extracto de', 'mailbox:archived': 'archivó',
  'mailbox:rejected': 'marcó como no publicable', 'mailbox:pending': 'devolvió a revisión',
};

export const describeAudit = (entry: AuditEntry) => `${ACTION[entry.action] ?? entry.action} ${ENTITY[entry.entity] ?? entry.entity}${entry.summary ? ` «${entry.summary}»` : ''}`;

export function AuditPage() {
  const { data, loading, error, reload } = useResource((signal) => api<AuditEntry[]>('/admin/audit', { signal }), []);
  return (
    <>
      <PageHeader title="Historial de cambios" subtitle="Últimos 200 cambios hechos desde el panel." />
      {loading ? (
        <SkeletonRows />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState icon={History} title="Sin cambios registrados" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Persona</th>
                <th scope="col">Cambio</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr key={entry.id}>
                  <td className="text-secondary" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(entry.createdAt)}</td>
                  <td>{entry.user?.name ?? 'Sistema'}</td>
                  <td>{describeAudit(entry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

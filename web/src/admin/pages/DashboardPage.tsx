import { AlertCircle, AlertTriangle, CheckCircle2, FileText, Flag, Headphones, HeartHandshake, Inbox, MessageSquareQuote, PenLine, Plus, SpellCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { Stats } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { buttonClass, ErrorState, PageHeader, SkeletonRows, StatTile } from '@/ui';
import { useAuth } from '../AuthProvider';
import { describeAudit } from './AuditPage';

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { data, loading, error, reload } = useResource((signal) => api<Stats>('/admin/stats', { signal }), []);

  return (
    <>
      <PageHeader
        title={`Hola, ${user?.name.split(' ')[0] ?? ''}`}
        subtitle="Resumen del sitio y tareas pendientes."
        actions={
          <>
            <Link to="/admin/trends/nuevo" className={buttonClass({})}>
              <Plus size={18} aria-hidden /> Nueva nota
            </Link>
            <Link to="/admin/buzon" className={buttonClass({ variant: 'secondary' })}>
              <Inbox size={18} aria-hidden /> Revisar buzón
            </Link>
          </>
        }
      />
      {loading ? (
        <SkeletonRows rows={3} />
      ) : error || !data ? (
        <ErrorState message={error || ''} onRetry={reload} />
      ) : (
        <div className="stack-lg">
          <div className="grid-stats stagger">
            <StatTile icon={Inbox} label="Relatos por revisar" value={data.pending} tone={data.pending ? 'accent' : 'neutral'} />
            <StatTile icon={Flag} label="Por revisar marcados por el filtro" value={data.flaggedPending} tone={data.flaggedPending ? 'danger' : 'neutral'} />
            <StatTile icon={FileText} label={`Notas publicadas · ${data.trendDrafts} borradores`} value={data.trends} />
            <StatTile icon={MessageSquareQuote} label="Entrevistas publicadas" value={data.interviews} tone="info" />
            <StatTile icon={SpellCheck} label="Términos del glosario" value={data.glossary} tone="success" />
            <StatTile icon={HeartHandshake} label="Artículos de Querer encajar" value={data.reflections} tone="brand" />
            <StatTile icon={Headphones} label="Episodios publicados" value={data.episodes} tone="warning" />
            <StatTile icon={Users} label="Integrantes del equipo" value={data.team} tone="neutral" />
          </div>

          {data.trendsMissingAuthor.length ? (
            <section className="card stack notice-card" aria-labelledby="sin-autora">
              <h2 id="sin-autora" className="row" style={{ fontSize: 20, gap: 8 }}>
                <AlertTriangle size={20} aria-hidden /> Notas publicadas sin autora
              </h2>
              <p className="text-secondary text-small">La autoría y las referencias ahora son obligatorias. Asigna una autora a estas notas (al guardarlas se pedirán ambas).</p>
              <ul className="todo-list">
                {data.trendsMissingAuthor.map((t) => (
                  <li key={t.id}>
                    <Link to={`/admin/trends/${t.id}`}>{t.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="grid-2">
            <section className="card stack" aria-labelledby="pendientes">
              <h2 id="pendientes" style={{ fontSize: 20 }}>Pendientes de configuración</h2>
              {data.missing.length ? (
                <>
                  <ul className="todo-list">
                    {data.missing.map((m) => (
                      <li key={m}><AlertCircle size={16} aria-hidden /> {m}</li>
                    ))}
                  </ul>
                  {isAdmin ? <Link to="/admin/configuracion" className="text-small">Completar en Configuración del sitio →</Link> : <p className="text-small text-secondary">Pídele a administración que los complete.</p>}
                </>
              ) : (
                <p className="row text-secondary" style={{ gap: 8 }}><CheckCircle2 size={18} aria-hidden color="var(--color-success)" /> Todo listo: contacto, redes y logo configurados.</p>
              )}
            </section>

            <section className="card stack" aria-labelledby="recientes">
              <h2 id="recientes" style={{ fontSize: 20 }}>Actividad reciente</h2>
              {data.recent.length ? (
                <ul className="activity">
                  {data.recent.map((entry) => (
                    <li key={entry.id}>
                      <PenLine size={15} aria-hidden />
                      <span>
                        <strong>{entry.user?.name ?? 'Sistema'}</strong> {describeAudit(entry)}
                        <span className="text-xs text-muted" style={{ display: 'block' }}>{formatDateTime(entry.createdAt)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-secondary">Aún no hay cambios registrados.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}

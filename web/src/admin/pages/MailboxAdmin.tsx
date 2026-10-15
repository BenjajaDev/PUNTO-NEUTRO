import { Archive, CheckCircle2, EyeOff, Inbox, Lock, RotateCcw, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { Submission, SubmissionStatus } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Badge, Button, Dialog, EmptyState, ErrorState, PageHeader, SkeletonRows, TextArea, useFeedback, type Tone } from '@/ui';
import { MAILBOX_CHANGED } from '../AdminLayout';
import { useAuth } from '../AuthProvider';

const STATUS: Record<SubmissionStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Por revisar', tone: 'accent' },
  APPROVED: { label: 'Publicado', tone: 'success' },
  ARCHIVED: { label: 'Archivado', tone: 'neutral' },
  REJECTED: { label: 'No publicable', tone: 'danger' },
};
const TABS: SubmissionStatus[] = ['PENDING', 'APPROVED', 'ARCHIVED', 'REJECTED'];

function Review({ item, onClose, onChanged }: { item: Submission; onClose: () => void; onChanged: () => void }) {
  const { isAdmin } = useAuth();
  const { confirm, notify } = useFeedback();
  const [excerpt, setExcerpt] = useState(item.publicExcerpt || '');
  const [note, setNote] = useState(item.editorNote || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<SubmissionStatus | null>(null);

  const update = async (status: SubmissionStatus, message: string) => {
    setBusy(status);
    try {
      await api(`/admin/mailbox/${item.id}`, { method: 'PATCH', body: { status, publicExcerpt: excerpt || undefined, editorNote: note || undefined } });
      notify({ tone: 'success', message });
      window.dispatchEvent(new Event(MAILBOX_CHANGED));
      onChanged();
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fields);
      notify({ tone: 'danger', title: 'No se pudo actualizar', message: errorMessage(error) });
    } finally {
      setBusy(null);
    }
  };

  const approve = async () => {
    if (!excerpt.trim()) {
      setErrors({ publicExcerpt: 'Escribe el extracto que se publicará.' });
      return;
    }
    const ok = await confirm({
      title: '¿Publicar este extracto?',
      message: 'Se mostrará en la página del Buzón. Verifica que no incluya nombres, lugares ni datos que identifiquen a nadie.',
      tone: 'brand',
      icon: ShieldCheck,
      confirmLabel: 'Publicar extracto',
    });
    if (ok) update('APPROVED', 'Extracto publicado en el Buzón.');
  };

  const remove = async () => {
    const done = await confirm({
      title: '¿Eliminar este relato definitivamente?',
      message: 'Úsalo cuando la persona pida borrar su relato. No se puede deshacer.',
      tone: 'danger',
      confirmLabel: 'Eliminar relato',
      onConfirm: () => api(`/admin/mailbox/${item.id}`, { method: 'DELETE' }),
    });
    if (done) {
      notify({ tone: 'success', message: 'Relato eliminado.' });
      window.dispatchEvent(new Event(MAILBOX_CHANGED));
      onChanged();
    }
  };

  return (
    <Dialog open wide title={`Relato #${item.id}`} onClose={onClose} dismissible={!busy}>
      <div className="stack">
        <div className="row" style={{ gap: 8 }}>
          <Badge tone={STATUS[item.status].tone}>{STATUS[item.status].label}</Badge>
          {item.anonymous ? <Badge tone="neutral" icon={EyeOff}>Anónimo</Badge> : <Badge tone="info">Firma: {item.alias || 'sin seudónimo'}</Badge>}
          {item.allowPublication ? <Badge tone="success" icon={CheckCircle2}>Autoriza publicar</Badge> : <Badge tone="warning" icon={Lock}>No autoriza publicar</Badge>}
          {item.topic ? <Badge>{item.topic}</Badge> : null}
          {item.ageRange ? <Badge tone="neutral">{item.ageRange}</Badge> : null}
        </div>
        <p className="text-xs text-muted">
          Recibido {formatDateTime(item.createdAt)} · consentimiento {formatDateTime(item.consentAt)}
          {item.reviewedBy ? ` · revisado por ${item.reviewedBy.name} (${formatDateTime(item.reviewedAt)})` : ''}
        </p>
        {item.contactEmail ? <p className="text-small">Correo de contacto: <a href={`mailto:${item.contactEmail}`}>{item.contactEmail}</a></p> : null}

        <section className="story-original" aria-label="Relato original (solo equipo)">
          <p className="text-xs" style={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Relato original · solo equipo</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{item.story}</p>
        </section>

        {item.allowPublication ? (
          <div className="stack-sm">
            <TextArea
              label="Extracto para publicar"
              rows={5}
              maxLength={2000}
              showCount
              value={excerpt}
              onChange={(e) => {
                setExcerpt(e.target.value);
                setErrors({});
              }}
              error={errors.publicExcerpt}
              hint="Filtro editorial: quita datos identificables, evita el sensacionalismo y la revictimización."
            />
            {!excerpt ? <Button variant="ghost" size="sm" onClick={() => setExcerpt(item.story.slice(0, 2000))} style={{ alignSelf: 'flex-start' }}>Usar el relato como base para editar</Button> : null}
          </div>
        ) : (
          <p className="text-small text-secondary row" style={{ gap: 8 }}><Lock size={16} aria-hidden /> La persona no autorizó la publicación: solo puede archivarse.</p>
        )}
        <TextArea label="Nota interna (opcional)" rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} hint="Solo la ve el equipo." />

        <div className="dialog__actions" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 8 }}>
            {isAdmin ? <Button variant="ghost" icon={Trash2} onClick={remove} disabled={Boolean(busy)}>Eliminar</Button> : null}
          </div>
          <div className="row" style={{ gap: 8 }}>
            {item.status !== 'PENDING' ? <Button variant="ghost" icon={RotateCcw} loading={busy === 'PENDING'} onClick={() => update('PENDING', 'Relato devuelto a «Por revisar».')}>Devolver a revisión</Button> : null}
            {item.status !== 'REJECTED' ? <Button variant="secondary" icon={XCircle} loading={busy === 'REJECTED'} onClick={() => update('REJECTED', 'Marcado como no publicable.')}>No publicable</Button> : null}
            {item.status !== 'ARCHIVED' ? <Button variant="secondary" icon={Archive} loading={busy === 'ARCHIVED'} onClick={() => update('ARCHIVED', 'Relato archivado.')}>Archivar</Button> : null}
            {item.allowPublication ? <Button icon={ShieldCheck} loading={busy === 'APPROVED'} onClick={approve}>{item.status === 'APPROVED' ? 'Actualizar extracto' : 'Aprobar y publicar'}</Button> : null}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export function MailboxAdmin() {
  const items = useResource((signal) => api<Submission[]>('/admin/mailbox', { signal }), []);
  const [tab, setTab] = useState<SubmissionStatus>('PENDING');
  const [selected, setSelected] = useState<Submission | null>(null);

  const counts = useMemo(() => Object.fromEntries(TABS.map((s) => [s, (items.data || []).filter((i) => i.status === s).length])), [items.data]);
  const visible = (items.data || []).filter((i) => i.status === tab);

  return (
    <>
      <PageHeader title="Buzón comunitario" subtitle="Lee con cuidado, aplica el filtro editorial y publica solo lo autorizado." />
      <div className="tabs" role="group" aria-label="Filtrar por estado">
        {TABS.map((s) => (
          <button key={s} type="button" aria-pressed={tab === s} className="tabs__tab" onClick={() => setTab(s)}>
            {STATUS[s].label} <span className="tabs__count">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>
      <div>
        {items.loading ? (
          <SkeletonRows />
        ) : items.error ? (
          <ErrorState message={items.error} onRetry={items.reload} />
        ) : !visible.length ? (
          <EmptyState icon={Inbox} title={tab === 'PENDING' ? 'No hay relatos por revisar' : 'Nada por aquí'} message={tab === 'PENDING' ? 'Cuando alguien escriba desde el sitio, aparecerá aquí.' : undefined} />
        ) : (
          <ul className="submissions stagger">
            {visible.map((item) => (
              <li key={item.id}>
                <button type="button" className="submission card" onClick={() => setSelected(item)}>
                  <span className="row-between" style={{ width: '100%' }}>
                    <strong>Relato #{item.id}</strong>
                    <span className="text-xs text-muted">{formatDateTime(item.createdAt)}</span>
                  </span>
                  <span className="submission__preview">{item.story}</span>
                  <span className="row" style={{ gap: 6 }}>
                    {item.anonymous ? <Badge tone="neutral" icon={EyeOff}>Anónimo</Badge> : <Badge tone="info">{item.alias || 'Con firma'}</Badge>}
                    {item.allowPublication ? <Badge tone="success">Autoriza publicar</Badge> : <Badge tone="warning">Solo lectura</Badge>}
                    {item.topic ? <Badge>{item.topic}</Badge> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected ? (
        <Review
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            items.reload();
          }}
        />
      ) : null}
    </>
  );
}

import { AlertTriangle, Archive, CheckCircle2, EyeOff, Flag, Inbox, LifeBuoy, Lock, RotateCcw, ShieldCheck, Tag, Trash2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { MODERATION_LABELS, OTHER_TOPIC, type Submission, type SubmissionStatus } from '@/lib/types';
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
const RISK_REASON = 'Posible riesgo: requiere contención';

const topicLabel = (item: Submission) => (item.topic === OTHER_TOPIC ? `Otros: ${item.topicOther ?? '—'}` : item.topic);

/** Aviso del filtro automático: nunca decide, solo pide mirar con más cuidado. */
function FlagNotice({ item }: { item: Submission }) {
  if (!item.flagged) return null;
  const risk = item.flagReasons.includes(RISK_REASON);
  return (
    <div className={`flag-notice${risk ? ' flag-notice--risk' : ''}`} role="note">
      {risk ? <LifeBuoy size={20} aria-hidden /> : <AlertTriangle size={20} aria-hidden />}
      <div className="stack-sm" style={{ gap: 4 }}>
        <strong>{risk ? 'Prioriza la contención' : 'El filtro automático marcó este relato'}</strong>
        <span className="text-small">{item.flagReasons.join(' · ')}</span>
        {item.flagMatches.length ? <span className="text-xs">Expresiones detectadas: {item.flagMatches.map((m) => `«${m}»`).join(', ')}</span> : null}
        {risk ? (
          <span className="text-small">
            No lo publiques. Si dejó un correo, considera responder con cuidado y con recursos de ayuda (*4141, Salud Responde 600 360 7777). Etiquétalo como «Requiere contención».
          </span>
        ) : (
          <span className="text-small">Puede ser una cita de algo que le dijeron: lee el contexto antes de decidir.</span>
        )}
      </div>
    </div>
  );
}

function Review({ item, onClose, onChanged }: { item: Submission; onClose: () => void; onChanged: () => void }) {
  const { isAdmin } = useAuth();
  const { confirm, notify } = useFeedback();
  const [excerpt, setExcerpt] = useState(item.publicExcerpt || '');
  const [note, setNote] = useState(item.editorNote || '');
  const [labels, setLabels] = useState<string[]>(item.labels || []);
  const toggleLabel = (label: string) => setLabels((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<SubmissionStatus | null>(null);

  const update = async (status: SubmissionStatus, message: string) => {
    setBusy(status);
    try {
      await api(`/admin/mailbox/${item.id}`, { method: 'PATCH', body: { status, publicExcerpt: excerpt || undefined, editorNote: note || undefined, labels } });
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
          {item.topic ? <Badge>{topicLabel(item)}</Badge> : null}
          {item.ageRange ? <Badge tone="neutral">{item.ageRange}</Badge> : null}
        </div>
        <p className="text-xs text-muted">
          Recibido {formatDateTime(item.createdAt)} · consentimiento {formatDateTime(item.consentAt)}
          {item.acceptedRulesAt ? ' · aceptó las normas de convivencia' : ''}
          {item.reviewedBy ? ` · revisado por ${item.reviewedBy.name} (${formatDateTime(item.reviewedAt)})` : ''}
        </p>
        <FlagNotice item={item} />
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
        <fieldset className="label-picker">
          <legend className="field__label">
            <Tag size={14} aria-hidden /> Etiquetas de moderación
          </legend>
          <div className="row" style={{ gap: 6 }}>
            {MODERATION_LABELS.map((label) => (
              <button key={label} type="button" className="chip chip--sm" aria-pressed={labels.includes(label)} onClick={() => toggleLabel(label)}>
                {label}
              </button>
            ))}
          </div>
          <span className="field__hint">Se guardan al elegir una acción (archivar, descartar, publicar…).</span>
        </fieldset>

        <div className="dialog__actions" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 8 }}>
            {isAdmin ? <Button variant="ghost" icon={Trash2} onClick={remove} disabled={Boolean(busy)}>Eliminar</Button> : null}
          </div>
          <div className="row" style={{ gap: 8 }}>
            {item.status !== 'PENDING' ? <Button variant="ghost" icon={RotateCcw} loading={busy === 'PENDING'} onClick={() => update('PENDING', 'Relato devuelto a «Por revisar».')}>Devolver a revisión</Button> : null}
            {item.status !== 'REJECTED' ? <Button variant="secondary" icon={XCircle} loading={busy === 'REJECTED'} onClick={() => update('REJECTED', 'Relato descartado: no se publicará.')}>Descartar</Button> : null}
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
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  const counts = useMemo(() => Object.fromEntries(TABS.map((s) => [s, (items.data || []).filter((i) => i.status === s).length])), [items.data]);
  const flaggedCount = (items.data || []).filter((i) => i.status === tab && i.flagged).length;
  const visible = (items.data || []).filter((i) => i.status === tab && (!onlyFlagged || i.flagged));

  return (
    <>
      <PageHeader title="Buzón comunitario" subtitle="Lee con cuidado, aplica el filtro editorial y publica solo lo autorizado." />
      <div className="tabs" role="group" aria-label="Filtrar por estado">
        {TABS.map((s) => (
          <button key={s} type="button" aria-pressed={tab === s} className="tabs__tab" onClick={() => setTab(s)}>
            {STATUS[s].label} <span className="tabs__count">{counts[s] ?? 0}</span>
          </button>
        ))}
        <button type="button" className="tabs__tab tabs__tab--flag" aria-pressed={onlyFlagged} onClick={() => setOnlyFlagged((v) => !v)}>
          <Flag size={15} aria-hidden /> Solo marcados por el filtro <span className="tabs__count">{flaggedCount}</span>
        </button>
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
                    {item.topic ? <Badge>{topicLabel(item)}</Badge> : null}
                    {item.flagged ? (
                      <Badge tone={item.flagReasons.includes(RISK_REASON) ? 'danger' : 'warning'} icon={item.flagReasons.includes(RISK_REASON) ? LifeBuoy : AlertTriangle}>
                        {item.flagReasons.includes(RISK_REASON) ? 'Requiere contención' : 'Revisar: filtro'}
                      </Badge>
                    ) : null}
                    {item.labels.map((label) => (
                      <Badge key={label} tone="neutral" icon={Tag}>{label}</Badge>
                    ))}
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

import { ArrowLeft, Eye, FileText, Pencil, Plus, Save, Search, Send, Trash2, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatDate, normalize } from '@/lib/format';
import { PLATFORM_LABEL, type Platform, type Trend, type TrendSummary } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Badge, Button, buttonClass, EmptyState, ErrorState, PageHeader, SelectField, SkeletonRows, TextArea, TextField, useFeedback } from '@/ui';
import { ImagePicker } from '../components/ImagePicker';
import { ListField } from '../components/ListField';
import { useEntityEditor } from '../components/useEntityEditor';

export const StatusBadge = ({ status }: { status: string }) => (status === 'PUBLISHED' ? <Badge tone="success">Publicado</Badge> : <Badge tone="warning">Borrador</Badge>);

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Todas' },
  { key: 'PUBLISHED', label: 'Publicadas' },
  { key: 'DRAFT', label: 'Borradores' },
];

export function TrendsAdmin() {
  const { confirm, notify } = useFeedback();
  const navigate = useNavigate();
  const items = useResource((signal) => api<TrendSummary[]>('/admin/trends', { signal }), []);
  const [status, setStatus] = useState('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return (items.data || []).filter((t) => (status === 'ALL' || t.status === status) && (!q || normalize(`${t.title} ${t.tags.join(' ')}`).includes(q)));
  }, [items.data, status, query]);

  const remove = async (trend: TrendSummary) => {
    const done = await confirm({
      title: `¿Eliminar «${trend.title}»?`,
      message: 'La nota desaparecerá del sitio y del panel. Esta acción no se puede deshacer.',
      tone: 'danger',
      confirmLabel: 'Eliminar nota',
      onConfirm: () => api(`/admin/trends/${trend.id}`, { method: 'DELETE' }),
    });
    if (done) {
      notify({ tone: 'success', message: 'Nota eliminada.' });
      items.reload();
    }
  };

  return (
    <>
      <PageHeader
        title="Anatomía de un Trend"
        subtitle="Notas que desglosan tendencias virales: origen, mecanismo, impacto y mirada neutral."
        actions={<Button icon={Plus} onClick={() => navigate('/admin/trends/nuevo')}>Nueva nota</Button>}
      />
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="row" role="group" aria-label="Filtrar por estado">
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} type="button" className="chip" aria-pressed={status === f.key} onClick={() => setStatus(f.key)}>{f.label}</button>
          ))}
        </div>
        <div className="search">
          <Search size={18} aria-hidden />
          <input className="input" type="search" aria-label="Buscar notas" placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      {items.loading ? (
        <SkeletonRows />
      ) : items.error ? (
        <ErrorState message={items.error} onRetry={items.reload} />
      ) : !filtered.length ? (
        <EmptyState icon={FileText} title={items.data?.length ? 'Sin resultados' : 'Aún no hay notas'} action={!items.data?.length ? <Button icon={Plus} onClick={() => navigate('/admin/trends/nuevo')}>Escribir la primera</Button> : undefined} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Título</th>
                <th scope="col">Plataforma</th>
                <th scope="col">Estado</th>
                <th scope="col">Actualizada</th>
                <th scope="col"><span className="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/admin/trends/${t.id}`} className="table-link">{t.title}</Link>
                    {t.author?.name ? <span className="text-xs text-muted" style={{ display: 'block' }}>Por {t.author.name}</span> : null}
                  </td>
                  <td>{PLATFORM_LABEL[t.platform]}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-secondary">{formatDate(t.updatedAt)}</td>
                  <td>
                    <div className="row" style={{ gap: 2, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      {t.status === 'PUBLISHED' ? (
                        <a href={`/anatomia-de-un-trend/${t.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'ghost', size: 'sm', iconOnly: true })} aria-label={`Ver «${t.title}» en el sitio`}>
                          <Eye size={16} aria-hidden />
                        </a>
                      ) : null}
                      <Button variant="ghost" size="sm" icon={Pencil} aria-label={`Editar «${t.title}»`} onClick={() => navigate(`/admin/trends/${t.id}`)} />
                      <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Eliminar «${t.title}»`} onClick={() => remove(t)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const EMPTY: Trend = {
  id: 0, slug: '', title: '', summary: '', platform: 'MULTIPLATFORM', tags: [], coverId: null,
  origin: '', mechanism: '', impact: '', neutralView: '', status: 'DRAFT', publishedAt: null, updatedAt: '',
};
const EDITABLE: (keyof Trend)[] = ['title', 'slug', 'summary', 'platform', 'tags', 'coverId', 'origin', 'mechanism', 'impact', 'neutralView'];

const PARTS: { key: 'origin' | 'mechanism' | 'impact' | 'neutralView'; label: string; hint: string }[] = [
  { key: 'origin', label: 'a. Origen y viralización', hint: '¿Dónde y cómo nació el trend? ¿Cómo se masificó?' },
  { key: 'mechanism', label: 'b. Mecanismo algorítmico y visual de comparación', hint: '¿Qué hace que el algoritmo lo empuje? ¿Cómo instala la comparación?' },
  { key: 'impact', label: 'c. Análisis de impacto psicológico y autoobjetivación', hint: 'Efectos documentados. Cita fuentes y especialistas cuando corresponda.' },
  { key: 'neutralView', label: 'd. Mirada desde la neutralidad corporal', hint: 'Resignificación funcional y libre de juicio.' },
];

export function TrendEditor() {
  const { id = 'nuevo' } = useParams();
  const { confirm } = useFeedback();
  const editor = useEntityEditor<Trend>({ endpoint: '/admin/trends', id, empty: EMPTY, listPath: '/admin/trends', editable: EDITABLE });
  const { form, set, errors, isNew, dirty, save } = editor;
  const published = editor.original?.status === 'PUBLISHED';

  if (editor.loading) return <SkeletonRows rows={5} label="Cargando nota" />;
  if (editor.loadError) return <ErrorState message={editor.loadError} />;

  const publish = () =>
    confirm({
      title: published ? '¿Publicar los cambios?' : '¿Publicar esta nota?',
      message: published ? 'Los cambios se verán de inmediato en el sitio.' : 'La nota quedará visible para todo público en Anatomía de un Trend.',
      tone: 'brand',
      icon: Send,
      confirmLabel: 'Publicar',
    }).then((ok) => ok && save('PUBLISHED', published ? 'Cambios publicados.' : 'Nota publicada.'));

  const unpublish = () =>
    confirm({ title: '¿Pasar a borrador?', message: 'La nota dejará de verse en el sitio hasta que vuelvas a publicarla.', tone: 'warning', icon: Undo2, confirmLabel: 'Pasar a borrador' }).then(
      (ok) => ok && save('DRAFT', 'La nota volvió a borrador.'),
    );

  return (
    <form className="editor" onSubmit={(e) => { e.preventDefault(); save(published ? 'PUBLISHED' : 'DRAFT', 'Cambios guardados.'); }} noValidate>
      <div className="editor__bar">
        <Link to="/admin/trends" className="link-arrow link-arrow--back"><ArrowLeft size={18} aria-hidden /> Notas</Link>
        <div className="row" style={{ gap: 8 }}>
          {!isNew ? <StatusBadge status={editor.original?.status || 'DRAFT'} /> : null}
          {dirty ? <Badge tone="accent">Cambios sin guardar</Badge> : null}
          {published ? (
            <a href={`/anatomia-de-un-trend/${editor.original?.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
              <Eye size={16} aria-hidden /> Ver en el sitio
            </a>
          ) : null}
          {published ? <Button variant="ghost" size="sm" icon={Undo2} onClick={unpublish}>Despublicar</Button> : null}
          <Button variant="secondary" icon={Save} onClick={() => save(published ? 'PUBLISHED' : 'DRAFT', published ? 'Cambios publicados.' : 'Borrador guardado.')} disabled={!dirty && !isNew}>
            {published ? 'Guardar' : 'Guardar borrador'}
          </Button>
          {!published ? <Button icon={Send} onClick={publish}>Publicar</Button> : null}
        </div>
      </div>

      <h1 style={{ fontSize: 26 }}>{isNew ? 'Nueva nota' : 'Editar nota'}</h1>

      <div className="editor__layout">
        <div className="stack-lg">
          <section className="card stack" aria-label="Datos principales">
            <TextField label="Título *" value={form.title} maxLength={160} onChange={(e) => set('title', e.target.value)} error={errors.title} />
            <TextArea label="Bajada / resumen *" rows={3} maxLength={400} showCount value={form.summary} onChange={(e) => set('summary', e.target.value)} error={errors.summary} hint="Aparece en las tarjetas y bajo el título." />
          </section>
          <section className="card stack" aria-labelledby="estructura">
            <div>
              <h2 id="estructura" style={{ fontSize: 20 }}>Estructura de la nota</h2>
              <p className="text-secondary text-small">Las cuatro partes son obligatorias. Separa párrafos con una línea en blanco.</p>
            </div>
            {PARTS.map((part) => (
              <TextArea key={part.key} label={`${part.label} *`} hint={part.hint} rows={6} maxLength={8000} value={form[part.key]} onChange={(e) => set(part.key, e.target.value)} error={errors[part.key]} />
            ))}
          </section>
        </div>
        <aside className="stack-lg">
          <section className="card stack" aria-label="Clasificación">
            <SelectField label="Plataforma" value={form.platform} onChange={(e) => set('platform', e.target.value as Platform)} options={(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => ({ value: p, label: PLATFORM_LABEL[p] }))} />
            <ListField label="Etiquetas" value={form.tags} max={8} onChange={(v) => set('tags', v)} placeholder="Ej. Skincare" />
            <TextField label="URL (slug)" value={form.slug} onChange={(e) => set('slug', e.target.value)} error={errors.slug} hint="Se genera desde el título si la dejas vacía." />
          </section>
          <section className="card stack" aria-label="Portada">
            <ImagePicker label="Portada" value={form.coverId} onChange={(v) => set('coverId', v)} hint="Formato horizontal. Sin portada se usa una ilustración con la paleta." />
          </section>
        </aside>
      </div>
    </form>
  );
}

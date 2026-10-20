import { ArrowLeft, Eye, HeartHandshake, Pencil, Plus, Save, Send, Trash2, Undo2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { REFLECTION_CATEGORY, type Reflection, type ReflectionCategory, type ReflectionSummary } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Badge, Button, buttonClass, EmptyState, ErrorState, PageHeader, SelectField, SkeletonRows, TextArea, TextField, useFeedback } from '@/ui';
import { AuthorSelect, ReferencesField } from '../components/AuthorFields';
import { ImagePicker } from '../components/ImagePicker';
import { ListField } from '../components/ListField';
import { useEntityEditor } from '../components/useEntityEditor';
import { referencesError, StatusBadge } from './TrendsAdmin';

/** RF-03 · Artículos de «Querer encajar». */
export function ReflectionsAdmin() {
  const { confirm, notify } = useFeedback();
  const navigate = useNavigate();
  const items = useResource((signal) => api<ReflectionSummary[]>('/admin/reflections', { signal }), []);

  const remove = async (item: ReflectionSummary) => {
    const done = await confirm({
      title: `¿Eliminar «${item.title}»?`,
      message: 'El artículo desaparecerá del sitio y del panel. Esta acción no se puede deshacer.',
      tone: 'danger',
      confirmLabel: 'Eliminar artículo',
      onConfirm: () => api(`/admin/reflections/${item.id}`, { method: 'DELETE' }),
    });
    if (done) {
      notify({ tone: 'success', message: 'Artículo eliminado.' });
      items.reload();
    }
  };

  return (
    <>
      <PageHeader
        title="Querer encajar"
        subtitle="Salud mental, prejuicios que genera la propia mente y estrategias de manejo emocional."
        actions={<Button icon={Plus} onClick={() => navigate('/admin/querer-encajar/nuevo')}>Nuevo artículo</Button>}
      />
      {items.loading ? (
        <SkeletonRows />
      ) : items.error ? (
        <ErrorState message={items.error} onRetry={items.reload} />
      ) : !items.data?.length ? (
        <EmptyState icon={HeartHandshake} title="Aún no hay artículos" action={<Button icon={Plus} onClick={() => navigate('/admin/querer-encajar/nuevo')}>Escribir el primero</Button>} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Título</th>
                <th scope="col">Tema</th>
                <th scope="col">Estado</th>
                <th scope="col">Actualizado</th>
                <th scope="col"><span className="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {items.data.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/admin/querer-encajar/${r.id}`} className="table-link">{r.title}</Link>
                    {r.authorMember?.name ? <span className="text-xs text-muted" style={{ display: 'block' }}>Por {r.authorMember.name}</span> : null}
                  </td>
                  <td>{REFLECTION_CATEGORY[r.category]}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="text-secondary">{formatDate(r.updatedAt)}</td>
                  <td>
                    <div className="row" style={{ gap: 2, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      {r.status === 'PUBLISHED' ? (
                        <a href={`/querer-encajar/${r.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'ghost', size: 'sm', iconOnly: true })} aria-label={`Ver «${r.title}» en el sitio`}>
                          <Eye size={16} aria-hidden />
                        </a>
                      ) : null}
                      <Button variant="ghost" size="sm" icon={Pencil} aria-label={`Editar «${r.title}»`} onClick={() => navigate(`/admin/querer-encajar/${r.id}`)} />
                      <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Eliminar «${r.title}»`} onClick={() => remove(r)} />
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

const EMPTY: Reflection = {
  id: 0, slug: '', title: '', category: 'ESTRATEGIAS', summary: '', coverId: null, body: '', keyIdeas: [], everydayExample: '',
  references: [], capsuleUrl: '', authorMemberId: null, status: 'DRAFT', publishedAt: null, updatedAt: '',
};
const EDITABLE: (keyof Reflection)[] = ['title', 'slug', 'category', 'summary', 'coverId', 'body', 'keyIdeas', 'everydayExample', 'references', 'capsuleUrl', 'authorMemberId'];

export function ReflectionEditor() {
  const { id = 'nuevo' } = useParams();
  const { confirm } = useFeedback();
  const editor = useEntityEditor<Reflection>({ endpoint: '/admin/reflections', id, empty: EMPTY, listPath: '/admin/querer-encajar', editable: EDITABLE });
  const { form, set, errors, isNew, dirty, save } = editor;
  const published = editor.original?.status === 'PUBLISHED';

  if (editor.loading) return <SkeletonRows rows={5} label="Cargando artículo" />;
  if (editor.loadError) return <ErrorState message={editor.loadError} />;

  const publish = () =>
    confirm({
      title: '¿Publicar este artículo?',
      message: 'Revisa que el lenguaje sea cuidadoso, que no dé consejos clínicos individuales y que las referencias respalden lo que afirma.',
      tone: 'brand',
      icon: Send,
      confirmLabel: 'Publicar',
    }).then((ok) => ok && save('PUBLISHED', 'Artículo publicado.'));
  const unpublish = () =>
    confirm({ title: '¿Pasar a borrador?', message: 'Dejará de verse en el sitio hasta que vuelvas a publicarlo.', tone: 'warning', icon: Undo2, confirmLabel: 'Pasar a borrador' }).then(
      (ok) => ok && save('DRAFT', 'El artículo volvió a borrador.'),
    );

  return (
    <form className="editor" onSubmit={(e) => { e.preventDefault(); save(published ? 'PUBLISHED' : 'DRAFT', 'Cambios guardados.'); }} noValidate>
      <div className="editor__bar">
        <Link to="/admin/querer-encajar" className="link-arrow link-arrow--back"><ArrowLeft size={18} aria-hidden /> Querer encajar</Link>
        <div className="row" style={{ gap: 8 }}>
          {!isNew ? <StatusBadge status={editor.original?.status || 'DRAFT'} /> : null}
          {dirty ? <Badge tone="accent">Cambios sin guardar</Badge> : null}
          {published ? (
            <a href={`/querer-encajar/${editor.original?.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
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

      <h1 style={{ fontSize: 26 }}>{isNew ? 'Nuevo artículo' : 'Editar artículo'}</h1>

      <div className="editor__layout">
        <div className="stack-lg">
          <section className="card stack" aria-label="Contenido">
            <TextField label="Título *" value={form.title} maxLength={160} onChange={(e) => set('title', e.target.value)} error={errors.title} />
            <TextArea label="Bajada / resumen *" rows={3} maxLength={400} showCount value={form.summary} onChange={(e) => set('summary', e.target.value)} error={errors.summary} />
            <TextArea
              label="Texto del artículo *"
              rows={16}
              maxLength={20000}
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
              error={errors.body}
              hint="Separa párrafos con una línea en blanco. «## » al inicio de una línea crea un subtítulo y «- » un punto de lista."
            />
          </section>
          <section className="card stack" aria-label="Ejemplo cotidiano">
            <TextArea label="Situación cotidiana" rows={3} maxLength={1500} showCount value={form.everydayExample} onChange={(e) => set('everydayExample', e.target.value)} hint="Un ejemplo reconocible que ayude a entender el concepto." />
          </section>
          <section className="card stack" aria-label="Referencias">
            <ReferencesField value={form.references} onChange={(v) => set('references', v)} error={referencesError(errors)} required />
          </section>
        </div>
        <aside className="stack-lg">
          <section className="card stack" aria-label="Clasificación">
            <SelectField
              label="Tema"
              value={form.category}
              onChange={(e) => set('category', e.target.value as ReflectionCategory)}
              options={(Object.keys(REFLECTION_CATEGORY) as ReflectionCategory[]).map((c) => ({ value: c, label: REFLECTION_CATEGORY[c] }))}
            />
            <AuthorSelect value={form.authorMemberId} onChange={(v) => set('authorMemberId', v)} error={errors.authorMemberId} />
            <ListField label="Ideas clave" value={form.keyIdeas} max={6} onChange={(v) => set('keyIdeas', v)} placeholder="Una idea por entrada" />
            <TextField label="URL (slug)" value={form.slug} onChange={(e) => set('slug', e.target.value)} error={errors.slug} hint="Se genera desde el título si la dejas vacía." />
          </section>
          <section className="card stack" aria-label="Portada y cápsula">
            <ImagePicker label="Portada" value={form.coverId} onChange={(v) => set('coverId', v)} hint="Sin portada se usa la ilustración de la sección." />
            <TextField label="Cápsula en redes (opcional)" type="url" value={form.capsuleUrl} onChange={(e) => set('capsuleUrl', e.target.value)} error={errors.capsuleUrl} placeholder="https://www.instagram.com/reel/…" />
          </section>
        </aside>
      </div>
    </form>
  );
}

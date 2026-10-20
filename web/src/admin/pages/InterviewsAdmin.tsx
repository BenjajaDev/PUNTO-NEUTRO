import { ArrowLeft, Eye, MessageSquareQuote, Pencil, Plus, Save, Send, Trash2, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { INTERVIEW_CATEGORIES, INTERVIEW_CATEGORY_LABEL, type Interview, type InterviewCategory } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Badge, Button, buttonClass, EmptyState, ErrorState, PageHeader, SkeletonRows, TextArea, TextField, useFeedback } from '@/ui';
import { ImagePicker } from '../components/ImagePicker';
import { InterviewCategoryPicker } from '../components/InterviewCategoryPicker';
import { InterviewQuestionsField } from '../components/InterviewQuestionsField';
import { useEntityEditor } from '../components/useEntityEditor';
import { StatusBadge } from './TrendsAdmin';

export function InterviewsAdmin() {
  const { confirm, notify } = useFeedback();
  const navigate = useNavigate();
  const items = useResource((signal) => api<Interview[]>('/admin/interviews', { signal }), []);
  const [category, setCategory] = useState<InterviewCategory | 'TODAS'>('TODAS');
  const counts = useMemo(
    () => Object.fromEntries(INTERVIEW_CATEGORIES.map((c) => [c.key, (items.data || []).filter((i) => i.category === c.key).length])) as Record<InterviewCategory, number>,
    [items.data],
  );
  const visible = (items.data || []).filter((i) => category === 'TODAS' || i.category === category);

  const remove = async (item: Interview) => {
    const done = await confirm({
      title: `¿Eliminar la entrevista a ${item.guestName}?`,
      message: 'Desaparecerá del sitio y del panel. Esta acción no se puede deshacer.',
      tone: 'danger',
      confirmLabel: 'Eliminar entrevista',
      onConfirm: () => api(`/admin/interviews/${item.id}`, { method: 'DELETE' }),
    });
    if (done) {
      notify({ tone: 'success', message: 'Entrevista eliminada.' });
      items.reload();
    }
  };

  return (
    <>
      <PageHeader title="Pequeñas Entrevistas" subtitle="Preguntas breves a expertas, influencers y personas comunes." actions={<Button icon={Plus} onClick={() => navigate('/admin/entrevistas/nuevo')}>Nueva entrevista</Button>} />
      {items.data?.length ? (
        <div className="row" role="group" aria-label="Filtrar por categoría" style={{ marginBottom: 16 }}>
          <button type="button" className="chip" aria-pressed={category === 'TODAS'} onClick={() => setCategory('TODAS')}>
            Todas <span className="chip__count">{items.data.length}</span>
          </button>
          {INTERVIEW_CATEGORIES.map((c) => (
            <button key={c.key} type="button" className="chip" aria-pressed={category === c.key} onClick={() => setCategory(c.key)}>
              {c.label} <span className="chip__count">{counts[c.key]}</span>
            </button>
          ))}
        </div>
      ) : null}
      {items.loading ? (
        <SkeletonRows />
      ) : items.error ? (
        <ErrorState message={items.error} onRetry={items.reload} />
      ) : !items.data?.length ? (
        <EmptyState icon={MessageSquareQuote} title="Aún no hay entrevistas" action={<Button icon={Plus} onClick={() => navigate('/admin/entrevistas/nuevo')}>Crear la primera</Button>} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Entrevistada</th>
                <th scope="col">Categoría</th>
                <th scope="col">Estado</th>
                <th scope="col">Actualizada</th>
                <th scope="col"><span className="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/admin/entrevistas/${item.id}`} className="table-link">{item.guestName}</Link>
                    {item.guestHandle ? <span className="text-xs text-muted" style={{ display: 'block' }}>{item.guestHandle}</span> : null}
                  </td>
                  <td><Badge tone="brand">{INTERVIEW_CATEGORY_LABEL[item.category]}</Badge></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td className="text-secondary">{formatDate(item.updatedAt)}</td>
                  <td>
                    <div className="row" style={{ gap: 2, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      {item.status === 'PUBLISHED' ? (
                        <a href={`/entrevistas/${item.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'ghost', size: 'sm', iconOnly: true })} aria-label={`Ver entrevista a ${item.guestName} en el sitio`}>
                          <Eye size={16} aria-hidden />
                        </a>
                      ) : null}
                      <Button variant="ghost" size="sm" icon={Pencil} aria-label={`Editar entrevista a ${item.guestName}`} onClick={() => navigate(`/admin/entrevistas/${item.id}`)} />
                      <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Eliminar entrevista a ${item.guestName}`} onClick={() => remove(item)} />
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

/** En el formulario la categoría puede estar vacía hasta que se elija (la API la exige). */
type InterviewForm = Omit<Interview, 'category'> & { category: InterviewCategory | '' };

const EMPTY: InterviewForm = {
  id: 0, slug: '', category: '', guestName: '', guestHandle: '', guestBio: '', photoId: null, intro: '',
  questions: [],
  status: 'DRAFT', publishedAt: null, updatedAt: '',
};
const EDITABLE: (keyof InterviewForm)[] = ['category', 'guestName', 'slug', 'guestHandle', 'guestBio', 'photoId', 'intro', 'questions'];

export function InterviewEditor() {
  const { id = 'nuevo' } = useParams();
  const { confirm } = useFeedback();
  const editor = useEntityEditor<InterviewForm>({ endpoint: '/admin/interviews', id, empty: EMPTY, listPath: '/admin/entrevistas', editable: EDITABLE });
  const { form, set, errors, isNew, dirty, save } = editor;
  const published = editor.original?.status === 'PUBLISHED';

  if (editor.loading) return <SkeletonRows rows={5} label="Cargando entrevista" />;
  if (editor.loadError) return <ErrorState message={editor.loadError} />;

  const publish = () =>
    confirm({ title: '¿Publicar esta entrevista?', message: 'Quedará visible para todo público en Pequeñas Entrevistas.', tone: 'brand', icon: Send, confirmLabel: 'Publicar' }).then(
      (ok) => ok && save('PUBLISHED', 'Entrevista publicada.'),
    );
  const unpublish = () =>
    confirm({ title: '¿Pasar a borrador?', message: 'Dejará de verse en el sitio hasta que vuelvas a publicarla.', tone: 'warning', icon: Undo2, confirmLabel: 'Pasar a borrador' }).then(
      (ok) => ok && save('DRAFT', 'La entrevista volvió a borrador.'),
    );

  return (
    <form className="editor" onSubmit={(e) => { e.preventDefault(); save(published ? 'PUBLISHED' : 'DRAFT', 'Cambios guardados.'); }} noValidate>
      <div className="editor__bar">
        <Link to="/admin/entrevistas" className="link-arrow link-arrow--back"><ArrowLeft size={18} aria-hidden /> Entrevistas</Link>
        <div className="row" style={{ gap: 8 }}>
          {!isNew ? <StatusBadge status={editor.original?.status || 'DRAFT'} /> : null}
          {dirty ? <Badge tone="accent">Cambios sin guardar</Badge> : null}
          {published ? <Button variant="ghost" size="sm" icon={Undo2} onClick={unpublish}>Despublicar</Button> : null}
          <Button variant="secondary" icon={Save} onClick={() => save(published ? 'PUBLISHED' : 'DRAFT', published ? 'Cambios publicados.' : 'Borrador guardado.')} disabled={!dirty && !isNew}>
            {published ? 'Guardar' : 'Guardar borrador'}
          </Button>
          {!published ? <Button icon={Send} onClick={publish}>Publicar</Button> : null}
        </div>
      </div>

      <h1 style={{ fontSize: 26 }}>{isNew ? 'Nueva entrevista' : 'Editar entrevista'}</h1>

      <div className="editor__layout">
        <div className="stack-lg">
          <section className="card stack" aria-label="Categoría">
            <InterviewCategoryPicker value={form.category} onChange={(v) => set('category', v)} error={errors.category} />
          </section>
          <section className="card stack" aria-label="Introducción">
            <TextArea label="Introducción" rows={3} maxLength={1500} showCount value={form.intro} onChange={(e) => set('intro', e.target.value)} error={errors.intro} hint="Contexto breve antes de las preguntas." />
          </section>
          <section className="card stack" aria-label="Preguntas y respuestas">
            <InterviewQuestionsField value={form.questions} onChange={(v) => set('questions', v)} errors={errors} />
          </section>
        </div>
        <aside className="stack-lg">
          <section className="card stack" aria-label="Persona entrevistada">
            <TextField label="Nombre *" value={form.guestName} maxLength={120} onChange={(e) => set('guestName', e.target.value)} error={errors.guestName} />
            <TextField label="Usuario en redes" value={form.guestHandle} maxLength={80} placeholder="@usuaria" onChange={(e) => set('guestHandle', e.target.value)} />
            <TextArea label="Descripción breve" rows={3} maxLength={600} value={form.guestBio} onChange={(e) => set('guestBio', e.target.value)} />
            <ImagePicker label="Foto" value={form.photoId} onChange={(v) => set('photoId', v)} hint="Usa solo fotos con autorización de la persona." />
            <TextField label="URL (slug)" value={form.slug} onChange={(e) => set('slug', e.target.value)} error={errors.slug} hint="Se genera desde el nombre si la dejas vacía." />
          </section>
        </aside>
      </div>
    </form>
  );
}

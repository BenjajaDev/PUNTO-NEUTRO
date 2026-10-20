import { Pencil, Plus, Search, Trash2, type LucideIcon } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { normalize } from '@/lib/format';
import { useResource } from '@/lib/useResource';
import { Button, Dialog, EmptyState, ErrorState, PageHeader, SkeletonRows, Switch, TextArea, TextField, useFeedback } from '@/ui';
import { ImagePicker } from './ImagePicker';
import { ListField } from './ListField';

export type CrudField<T> = {
  key: keyof T & string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'switch' | 'list' | 'image' | 'url';
  required?: boolean;
  hint?: string;
  maxLength?: number;
  /** Máximo de elementos (campos `list`). */
  max?: number;
  full?: boolean;
  placeholder?: string;
  /** Validación propia en el navegador; devuelve el mensaje de error o nada. La API valida igual. */
  validate?: (value: unknown) => string | undefined;
};

type Props<T extends { id?: number }> = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  itemName: string;
  endpoint: string;
  empty: T;
  fields: CrudField<T>[];
  columns: { label: string; render: (item: T) => ReactNode }[];
  searchText: (item: T) => string;
  describe: (item: T) => string;
  deleteMessage?: string;
  /** Vista previa en vivo dentro del formulario (ej. la tarjeta del podcast). */
  preview?: (item: T) => ReactNode;
};

/**
 * Página CRUD genérica del panel: tabla + búsqueda + formulario en diálogo +
 * eliminación con confirmación. Glosario, Podcast y Equipo la comparten para
 * que todas se comporten y den feedback igual.
 */
export function CrudDialogPage<T extends { id?: number }>({ title, subtitle, icon, itemName, endpoint, empty, fields, columns, searchText, describe, deleteMessage, preview }: Props<T>) {
  const { confirm, notify } = useFeedback();
  const items = useResource((signal) => api<T[]>(endpoint, { signal }), [endpoint]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<T | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return (items.data || []).filter((item) => !q || normalize(searchText(item)).includes(q));
  }, [items.data, query, searchText]);

  const open = (item: T) => {
    setErrors({});
    setEditing({ ...item });
  };

  const setField = (key: string, value: unknown) => {
    setEditing((prev) => (prev ? ({ ...prev, [key]: value } as T) : prev));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const submit = async () => {
    if (!editing) return;
    const next: Record<string, string> = {};
    fields.forEach((field) => {
      const value = editing[field.key];
      if (field.required && (value === undefined || value === null || String(value).trim() === '')) next[field.key] = 'Campo obligatorio.';
      else if (field.validate) {
        const message = field.validate(value);
        if (message) next[field.key] = message;
      }
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    const { id, ...body } = editing as T & { id?: number };
    // Solo se envían los campos editables (sin fechas ni metadatos).
    const payload = Object.fromEntries(fields.map((f) => [f.key, (body as Record<string, unknown>)[f.key]]));
    setSaving(true);
    try {
      await api(id ? `${endpoint}/${id}` : endpoint, { method: id ? 'PUT' : 'POST', body: payload });
      notify({ tone: 'success', message: `${itemName} guardado.` });
      setEditing(null);
      items.reload();
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fields);
      notify({ tone: 'danger', title: 'No se pudo guardar', message: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const askRemove = async (item: T) => {
    const done = await confirm({
      title: `¿Eliminar «${describe(item)}»?`,
      message: deleteMessage || 'Dejará de aparecer en el sitio. Esta acción no se puede deshacer.',
      tone: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: () => api(`${endpoint}/${item.id}`, { method: 'DELETE' }),
    });
    if (done) {
      notify({ tone: 'success', message: `${itemName} eliminado.` });
      items.reload();
    }
  };

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} actions={<Button icon={Plus} onClick={() => open({ ...empty })}>Nuevo</Button>} />
      <div className="search admin-search">
        <Search size={18} aria-hidden />
        <input className="input" type="search" aria-label={`Buscar en ${title.toLowerCase()}`} placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {items.loading ? (
        <SkeletonRows rows={4} />
      ) : items.error ? (
        <ErrorState message={items.error} onRetry={items.reload} />
      ) : !filtered.length ? (
        <EmptyState icon={query ? Search : icon} title={query ? 'Sin resultados' : `Aún no hay registros`} message={query ? 'Prueba con otra búsqueda.' : `Crea el primero con «Nuevo».`} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {columns.map((c) => <th key={c.label} scope="col">{c.label}</th>)}
                <th scope="col"><span className="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={item.id ?? index}>
                  {columns.map((c) => <td key={c.label}>{c.render(item)}</td>)}
                  <td>
                    <div className="row" style={{ gap: 2, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      <Button variant="ghost" size="sm" icon={Pencil} aria-label={`Editar ${describe(item)}`} onClick={() => open(item)} />
                      <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Eliminar ${describe(item)}`} onClick={() => askRemove(item)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={Boolean(editing)}
        wide
        title={editing?.id ? `Editar ${itemName.toLowerCase()}` : `Nuevo ${itemName.toLowerCase()}`}
        dismissible={!saving}
        onClose={() => setEditing(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
            <Button onClick={submit} loading={saving}>Guardar</Button>
          </>
        }
      >
        {editing ? (
          <div className="form-grid">
            {fields.map((field) => {
              const value = editing[field.key] as unknown;
              const label = `${field.label}${field.required ? ' *' : ''}`;
              const span = field.full || field.type === 'textarea' || field.type === 'list' ? { gridColumn: '1 / -1' } : undefined;
              let control: ReactNode;
              switch (field.type) {
                case 'textarea':
                  control = <TextArea label={label} hint={field.hint} rows={4} maxLength={field.maxLength} showCount={Boolean(field.maxLength)} value={(value as string) || ''} error={errors[field.key]} onChange={(e) => setField(field.key, e.target.value)} />;
                  break;
                case 'switch':
                  control = <Switch label={field.label} description={field.hint} checked={Boolean(value)} onChange={(v) => setField(field.key, v)} />;
                  break;
                case 'list':
                  control = <ListField label={field.label} hint={field.hint} max={field.max} placeholder={field.placeholder} value={(value as string[]) || []} error={errors[field.key]} onChange={(v) => setField(field.key, v)} />;
                  break;
                case 'image':
                  control = <ImagePicker label={field.label} hint={field.hint} value={value as number | null} onChange={(v) => setField(field.key, v)} />;
                  break;
                default:
                  control = (
                    <TextField
                      label={label}
                      hint={field.hint}
                      type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                      value={value === null || value === undefined ? '' : String(value)}
                      error={errors[field.key]}
                      onChange={(e) => setField(field.key, field.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
                    />
                  );
              }
              return <div key={field.key} style={span}>{control}</div>;
            })}
            {preview ? (
              <section className="crud-preview" aria-label="Vista previa" style={{ gridColumn: '1 / -1' }}>
                <p className="field__label">Vista previa</p>
                <div className="crud-preview__frame">{preview(editing)}</div>
              </section>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

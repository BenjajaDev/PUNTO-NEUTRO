import { Copy, ImagePlus, Pencil, Trash2, Upload } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatBytes, formatDate, mediaUrl } from '@/lib/format';
import type { MediaItem } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Button, Dialog, EmptyState, ErrorState, PageHeader, Skeleton, TextField, useFeedback } from '@/ui';
import { ACCEPTED_IMAGES, uploadImage } from '../components/ImagePicker';

export function MediaAdmin() {
  const { confirm, notify } = useFeedback();
  const media = useResource((signal) => api<MediaItem[]>('/admin/media', { signal }), []);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [alt, setAlt] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null | undefined) => {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        await uploadImage(file);
        ok += 1;
      } catch (error) {
        notify({ tone: 'danger', title: `No se pudo subir ${file.name}`, message: errorMessage(error) });
      }
    }
    setUploading(false);
    if (ok) {
      notify({ tone: 'success', message: ok === 1 ? 'Imagen subida.' : `${ok} imágenes subidas.` });
      media.reload();
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    upload(event.dataTransfer.files);
  };

  const remove = async (item: MediaItem) => {
    const done = await confirm({
      title: '¿Eliminar esta imagen?',
      message: 'Si se usa como logo, portada o foto, ese lugar quedará sin imagen. No se puede deshacer.',
      tone: 'danger',
      confirmLabel: 'Eliminar imagen',
      onConfirm: () => api(`/admin/media/${item.id}`, { method: 'DELETE' }),
    });
    if (done) {
      notify({ tone: 'success', message: 'Imagen eliminada.' });
      media.reload();
    }
  };

  const saveAlt = async () => {
    if (!editing) return;
    try {
      await api(`/admin/media/${editing.id}`, { method: 'PATCH', body: { alt } });
      notify({ tone: 'success', message: 'Descripción guardada.' });
      setEditing(null);
      media.reload();
    } catch (error) {
      notify({ tone: 'danger', message: errorMessage(error) });
    }
  };

  const copy = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(new URL(mediaUrl(item.id)!, window.location.origin).href);
      notify({ tone: 'success', message: 'Enlace copiado.' });
    } catch {
      notify({ tone: 'warning', message: 'No se pudo copiar el enlace.' });
    }
  };

  return (
    <>
      <PageHeader title="Medios" subtitle="Biblioteca de imágenes guardadas en la base de datos (PNG, JPG, WEBP, AVIF o GIF, máx. 5 MB)." actions={<Button icon={Upload} loading={uploading} onClick={() => input.current?.click()}>Subir imágenes</Button>} />
      <input ref={input} type="file" accept={ACCEPTED_IMAGES} multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
      <div
        className="dropzone"
        data-dragging={dragging}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <ImagePlus size={22} aria-hidden /> Arrastra imágenes aquí o usa «Subir imágenes».
      </div>

      {media.loading ? (
        <div className="media-grid">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={170} radius={14} />)}</div>
      ) : media.error ? (
        <ErrorState message={media.error} onRetry={media.reload} />
      ) : !media.data?.length ? (
        <EmptyState icon={ImagePlus} title="La biblioteca está vacía" message="Sube el logo, portadas de notas o fotos del equipo." />
      ) : (
        <ul className="media-grid media-grid--lg stagger">
          {media.data.map((item) => (
            <li key={item.id} className="media-card card">
              <img src={mediaUrl(item.id)!} alt={item.alt} loading="lazy" />
              <div className="media-card__info">
                <strong className="media-card__name" title={item.filename}>{item.filename}</strong>
                <span className="text-xs text-muted">{formatBytes(item.size)} · {formatDate(item.createdAt)}</span>
                {!item.alt ? <span className="text-xs" style={{ color: 'var(--color-warning-text)' }}>Sin descripción</span> : null}
              </div>
              <div className="row" style={{ gap: 2 }}>
                <Button variant="ghost" size="sm" icon={Pencil} aria-label={`Editar descripción de ${item.filename}`} onClick={() => { setEditing(item); setAlt(item.alt); }} />
                <Button variant="ghost" size="sm" icon={Copy} aria-label={`Copiar enlace de ${item.filename}`} onClick={() => copy(item)} />
                <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Eliminar ${item.filename}`} onClick={() => remove(item)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(editing)} wide title="Descripción de la imagen" onClose={() => setEditing(null)}
        actions={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={saveAlt}>Guardar</Button></>}
      >
        {editing ? (
          <div className="stack">
            <img src={mediaUrl(editing.id)!} alt="" style={{ maxHeight: 240, borderRadius: 12, objectFit: 'contain', alignSelf: 'center' }} />
            <TextField label="Texto alternativo" value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} hint="Describe la imagen para personas que usan lector de pantalla." />
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

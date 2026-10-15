import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { mediaUrl } from '@/lib/format';
import type { MediaItem } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Button, Dialog, EmptyState, Skeleton, useFeedback } from '@/ui';

export const ACCEPTED_IMAGES = 'image/png,image/jpeg,image/webp,image/avif,image/gif';
export const MAX_IMAGE_MB = 5;

/** Sube una imagen a la biblioteca (guardada en Postgres). */
export async function uploadImage(file: File, alt = '') {
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`La imagen supera los ${MAX_IMAGE_MB} MB.`);
  const body = new FormData();
  body.append('file', file);
  body.append('alt', alt);
  return api<MediaItem>('/admin/media', { method: 'POST', body });
}

function Library({ onPick, onClose }: { onPick: (item: MediaItem) => void; onClose: () => void }) {
  const { notify } = useFeedback();
  const media = useResource((signal) => api<MediaItem[]>('/admin/media', { signal }), []);
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const item = await uploadImage(file);
      notify({ tone: 'success', message: 'Imagen subida.' });
      onPick(item);
    } catch (error) {
      notify({ tone: 'danger', title: 'No se pudo subir', message: errorMessage(error) });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open wide title="Elegir imagen" message="Selecciona una imagen de la biblioteca o sube una nueva (PNG, JPG, WEBP, AVIF o GIF, máx. 5 MB)." onClose={onClose}
      actions={
        <>
          <input ref={input} type="file" accept={ACCEPTED_IMAGES} hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button icon={Upload} loading={uploading} onClick={() => input.current?.click()}>Subir imagen</Button>
        </>
      }
    >
      {media.loading ? (
        <div className="media-grid">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={110} radius={12} />)}</div>
      ) : !media.data?.length ? (
        <EmptyState icon={ImagePlus} title="La biblioteca está vacía" message="Sube la primera imagen." />
      ) : (
        <ul className="media-grid" aria-label="Biblioteca de imágenes">
          {media.data.map((item) => (
            <li key={item.id}>
              <button type="button" className="media-pick" onClick={() => onPick(item)} aria-label={`Elegir ${item.alt || item.filename}`}>
                <img src={mediaUrl(item.id)!} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

/** Campo de imagen: vista previa + elegir/subir + quitar. */
export function ImagePicker({ label, value, onChange, hint }: { label: string; value: number | null | undefined; onChange: (id: number | null) => void; hint?: string }) {
  const [open, setOpen] = useState(false);
  const src = mediaUrl(value);
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="image-picker">
        {src ? <img src={src} alt="Vista previa" className="image-picker__preview" /> : <span className="image-picker__empty"><ImagePlus size={26} aria-hidden /></span>}
        <div className="stack-sm">
          <Button variant="secondary" size="sm" icon={ImagePlus} onClick={() => setOpen(true)}>{src ? 'Cambiar imagen' : 'Elegir imagen'}</Button>
          {src ? <Button variant="ghost" size="sm" icon={Trash2} onClick={() => onChange(null)}>Quitar</Button> : null}
        </div>
      </div>
      {hint ? <span className="field__hint">{hint}</span> : null}
      {open ? <Library onClose={() => setOpen(false)} onPick={(item) => { onChange(item.id); setOpen(false); }} /> : null}
    </div>
  );
}

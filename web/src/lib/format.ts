const dateFmt = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatDate = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : '');
export const formatDateTime = (iso?: string | null) => (iso ? dateTimeFmt.format(new Date(iso)) : '');
export const mediaUrl = (id?: number | null) => (id ? `/api/media/${id}` : null);
export const formatBytes = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

/** Tiempo de lectura aproximado (200 palabras por minuto). */
export function readingTime(...texts: string[]) {
  const words = texts.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Normaliza para búsquedas sin tildes ni mayúsculas. */
export const normalize = (value: string) => value.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Divide un texto largo en párrafos por líneas en blanco o saltos simples. */
export const paragraphs = (text: string) => text.split(/\n+/).map((p) => p.trim()).filter(Boolean);

export function soundcloudEmbed(url: string, color = '#7D4C97') {
  const params = new URLSearchParams({ url, color, auto_play: 'false', hide_related: 'true', show_comments: 'false', show_user: 'true', show_reposts: 'false', visual: 'false' });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

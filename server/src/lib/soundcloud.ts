/**
 * Enlaces de SoundCloud: valida y deja una forma canónica.
 *
 * Se acepta lo que la gente copia de verdad (con «www.», desde el celular con
 * «m.», enlaces cortos «on.soundcloud.com» y con parámetros de rastreo como
 * ?si=… o utm_*), y se guarda limpio: https://soundcloud.com/usuaria/episodio.
 * Se rechaza el código para insertar (w.soundcloud.com) y la API, que no son
 * páginas que una persona pueda abrir.
 */

const CANONICAL_HOST = 'soundcloud.com';
const ALIASES = new Set(['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com']);
const SHORT_HOST = 'on.soundcloud.com';

export type SoundcloudResult = { ok: true; url: string } | { ok: false; error: string };

export const SOUNDCLOUD_HINT = 'Pega el enlace del episodio en SoundCloud (Compartir → Copiar enlace).';

export function normalizeSoundcloudUrl(input: string): SoundcloudResult {
  const raw = input.trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: `No es un enlace válido. ${SOUNDCLOUD_HINT}` };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false, error: SOUNDCLOUD_HINT };

  const host = url.hostname.toLowerCase();
  if (host === 'w.soundcloud.com' || host === 'api.soundcloud.com') {
    return { ok: false, error: 'Ese es el código para insertar o un enlace de la API. ' + SOUNDCLOUD_HINT };
  }
  const segments = url.pathname.split('/').filter(Boolean);

  if (host === SHORT_HOST) {
    if (segments.length !== 1) return { ok: false, error: SOUNDCLOUD_HINT };
    return { ok: true, url: `https://${SHORT_HOST}/${segments[0]}` };
  }
  if (!ALIASES.has(host)) return { ok: false, error: `El enlace debe ser de SoundCloud. ${SOUNDCLOUD_HINT}` };
  // usuaria/episodio o usuaria/sets/lista: un perfil solo no es un episodio.
  if (segments.length < 2) return { ok: false, error: 'Ese enlace es de un perfil, no de un episodio. ' + SOUNDCLOUD_HINT };

  // Sin parámetros ni fragmento: ?si=… y utm_* solo sirven para rastrear.
  // pathname ya viene codificado (%20, etc.): se reutiliza tal cual.
  return { ok: true, url: `https://${CANONICAL_HOST}/${segments.join('/')}` };
}

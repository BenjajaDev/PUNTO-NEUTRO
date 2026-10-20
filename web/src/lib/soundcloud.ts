/**
 * Validación de enlaces de SoundCloud y palabras clave en el panel.
 * Reutiliza los MISMOS módulos que la API (funciones puras, sin dependencias):
 * el panel avisa al instante y el servidor aplica exactamente la misma regla.
 */
export { normalizeSoundcloudUrl, SOUNDCLOUD_HINT } from '../../../server/src/lib/soundcloud.ts';
export { MAX_TAG_LENGTH, MAX_TAGS, normalizeTags, tagKey } from '../../../server/src/lib/tags.ts';

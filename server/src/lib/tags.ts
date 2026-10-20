/**
 * Palabras clave (tags) de los episodios: sin «#», sin espacios de más y sin
 * duplicados aunque cambien mayúsculas o tildes («Salud mental» = «salud Mental»).
 * Se conserva cómo la escribió el equipo la primera vez.
 */
export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 30;

export const tagKey = (tag: string) =>
  tag
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function cleanTag(tag: string) {
  return tag.replace(/^#+/, '').replace(/\s+/g, ' ').trim();
}

export function normalizeTags(tags: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = cleanTag(raw);
    const key = tagKey(tag);
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

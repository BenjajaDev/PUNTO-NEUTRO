/** «Clean girl: el filtro de lo natural» → «clean-girl-el-filtro-de-lo-natural» */
export function slugify(text: string) {
  return text
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'sin-titulo';
}

/** Agrega -2, -3… hasta encontrar un slug libre. */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>) {
  const root = slugify(base);
  let candidate = root;
  for (let n = 2; await exists(candidate); n += 1) candidate = `${root}-${n}`;
  return candidate;
}

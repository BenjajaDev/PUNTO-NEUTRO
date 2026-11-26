import type { RequestHandler } from 'express';
import { prisma } from '../db.js';

const DB_TIMEOUT_MS = 5000;
const RETRY_SECONDS = 5;

/**
 * Tokens del sistema de diseño (web/src/theme/tokens.ts) que usa esta página.
 * La API no sirve el CSS del sitio, por eso van copiados; un test verifica que
 * coincidan con los del sitio en ambos temas.
 */
export const STATUS_THEME = {
  light: { background: '#EFE9D7', surface: '#FBF8F0', border: '#DDD1BB', textPrimary: '#2B1D33', textSecondary: '#54435E', heading: '#5E3474', accent: '#F49A9C', successText: '#225C41', successSoft: '#DCEFE4', dangerText: '#8C1D17', dangerSoft: '#F8DEDB' },
  dark: { background: '#1A1220', surface: '#251A2D', border: '#3D2D47', textPrimary: '#F3EDDF', textSecondary: '#D3C7D8', heading: '#E8CDEF', accent: '#F49A9C', successText: '#86D9B0', successSoft: '#17332A', dangerText: '#F7A8A2', dangerSoft: '#3D1B1A' },
} as const;

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const cssVars = (theme: Record<string, string>) =>
  Object.entries(theme)
    .map(([name, value]) => `--color-${kebab(name)}: ${value};`)
    .join(' ');

export type DbStatus = { ok: true; ms: number } | { ok: false };

/** Una consulta real a la base: que el proceso responda no garantiza que Postgres también. */
export async function checkDatabase(): Promise<DbStatus> {
  const started = performance.now();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), DB_TIMEOUT_MS);
  });
  try {
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);
    return { ok: true, ms: Math.round(performance.now() - started) };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

export function renderStatusPage(status: DbStatus) {
  const title = status.ok ? 'Base de datos conectada' : 'La base de datos no responde';
  const detail = status.ok
    ? `La API de Punto Neutro está activa y la base respondió en ${status.ms} ms. Ya puedes usar el sitio y el panel.`
    : `La API está despertando o la base todavía no responde. Esta página vuelve a intentarlo sola cada ${RETRY_SECONDS} segundos.`;
  const tone = status.ok ? 'success' : 'danger';
  // Sin scripts (la CSP los bloquea): el reintento es un meta refresh.
  const refresh = status.ok ? '' : `<meta http-equiv="refresh" content="${RETRY_SECONDS}">`;
  return `<!doctype html>
<html lang="es-CL">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
${refresh}
<title>${title} · Punto Neutro</title>
<style>
  :root { color-scheme: light dark; ${cssVars(STATUS_THEME.light)} }
  @media (prefers-color-scheme: dark) { :root { ${cssVars(STATUS_THEME.dark)} } }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; box-sizing: border-box; background: var(--color-background); color: var(--color-text-primary); font-family: Montserrat, system-ui, sans-serif; }
  main { max-width: 440px; background: var(--color-surface); border: 1px solid var(--color-border); border-top: 4px solid var(--color-accent); border-radius: 16px; padding: 32px 28px; text-align: center; }
  .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; background: var(--color-${tone}-soft); color: var(--color-${tone}-text); font-weight: 700; font-size: 14px; }
  h1 { color: var(--color-heading); font-family: Lora, Georgia, serif; font-weight: 600; font-size: 26px; margin: 18px 0 10px; }
  p { margin: 0; line-height: 1.6; color: var(--color-text-secondary); }
</style>
</head>
<body>
<main>
  <span class="badge"><span aria-hidden="true">${status.ok ? '●' : '○'}</span> ${status.ok ? 'API activa' : 'Esperando a la base'}</span>
  <h1>${title}</h1>
  <p>${detail}</p>
</main>
</body>
</html>`;
}

/** Página para despertar el servicio y confirmar que la base está lista. */
export const statusPage: RequestHandler = async (_req, res) => {
  const status = await checkDatabase();
  res
    .status(status.ok ? 200 : 503)
    .set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' })
    .type('html')
    .send(renderStatusPage(status));
};

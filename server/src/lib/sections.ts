import type { RequestHandler } from 'express';
import { prisma } from '../db.js';
import type { SiteSectionKey } from '../schemas.js';
import { HttpError } from './http.js';

export async function getDisabledSections(): Promise<SiteSectionKey[]> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 }, select: { disabledSections: true } });
  return settings?.disabledSections ?? [];
}

/**
 * Corta las rutas públicas de una sección oculta desde el panel: ocultarla
 * en el menú no basta, su contenido tampoco debe poder leerse ni enviarse.
 */
export const requireSection =
  (section: SiteSectionKey): RequestHandler =>
  async (_req, _res, next) => {
    if ((await getDisabledSections()).includes(section)) throw new HttpError(404, 'Esta sección no está disponible por ahora.');
    next();
  };

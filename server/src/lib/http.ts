import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';

z.config(z.locales.es());

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const notFound = (what = 'El recurso') => new HttpError(404, `${what} no existe o fue eliminado.`);

/** Valida con zod y devuelve errores por campo (para mostrarlos junto a cada input del panel). */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  throw new HttpError(400, 'Revisa los campos marcados.', fields);
}

export function idParam(value: unknown) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificador inválido.');
  return id;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, fields: err.fields });
    return;
  }
  // Errores conocidos de Prisma → mensajes en español para el panel.
  const code = (err as { code?: string })?.code;
  if (code === 'P2002') {
    res.status(409).json({ error: 'Ya existe un registro con ese valor (por ejemplo, el mismo título o correo).' });
    return;
  }
  if (code === 'P2025') {
    res.status(404).json({ error: 'El registro no existe o fue eliminado.' });
    return;
  }
  if ((err as { type?: string })?.type === 'entity.too.large') {
    res.status(413).json({ error: 'El contenido es demasiado grande.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Ocurrió un error inesperado. Intenta nuevamente.' });
};

export const notFoundApi: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
};

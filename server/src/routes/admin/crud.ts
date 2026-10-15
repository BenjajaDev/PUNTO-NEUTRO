import { Router, type Request } from 'express';
import type { z } from 'zod';
import { audit } from '../../lib/audit.js';
import { idParam, parse } from '../../lib/http.js';

// Delegado mínimo de Prisma que usa el CRUD genérico.
type Delegate = {
  findMany: (args: object) => Promise<unknown[]>;
  findUnique: (args: { where: { id: number } }) => Promise<Record<string, unknown> | null>;
  create: (args: { data: object }) => Promise<Record<string, unknown> & { id: number }>;
  update: (args: { where: { id: number }; data: object }) => Promise<Record<string, unknown> & { id: number }>;
  delete: (args: { where: { id: number } }) => Promise<Record<string, unknown>>;
};

type CrudOptions<S extends z.ZodType> = {
  entity: string;
  delegate: Delegate;
  schema: S;
  orderBy: object | object[];
  /** Nombre legible para el historial. */
  describe: (item: Record<string, unknown>) => string;
  /** Ajusta los datos antes de guardar (slug, fecha de publicación, autoría…). */
  prepare?: (data: z.infer<S>, ctx: { req: Request; existing: Record<string, unknown> | null }) => Promise<object> | object;
  listArgs?: object;
};

/**
 * Rutas REST estándar del panel (listar, ver, crear, editar, eliminar) con
 * validación zod e historial. Un solo lugar para que todas las secciones se
 * comporten igual.
 */
export function crudRouter<S extends z.ZodType>({ entity, delegate, schema, orderBy, describe, prepare, listArgs }: CrudOptions<S>) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await delegate.findMany({ orderBy, ...listArgs }));
  });

  router.get('/:id', async (req, res) => {
    const item = await delegate.findUnique({ where: { id: idParam(req.params.id) } });
    if (!item) return res.status(404).json({ error: `No se encontró el registro.` });
    res.json(item);
  });

  router.post('/', async (req, res) => {
    const data = parse(schema, req.body);
    const prepared = prepare ? await prepare(data, { req, existing: null }) : (data as object);
    const created = await delegate.create({ data: prepared });
    await audit(req.user?.id, 'create', entity, created.id, describe(created));
    res.status(201).json(created);
  });

  router.put('/:id', async (req, res) => {
    const id = idParam(req.params.id);
    const existing = await delegate.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'El registro no existe o fue eliminado.' });
    const data = parse(schema, req.body);
    const prepared = prepare ? await prepare(data, { req, existing }) : (data as object);
    const updated = await delegate.update({ where: { id }, data: prepared });
    await audit(req.user?.id, 'update', entity, id, describe(updated));
    res.json(updated);
  });

  router.delete('/:id', async (req, res) => {
    const id = idParam(req.params.id);
    const removed = await delegate.delete({ where: { id } });
    await audit(req.user?.id, 'delete', entity, id, describe(removed));
    res.json({ ok: true });
  });

  return router;
}

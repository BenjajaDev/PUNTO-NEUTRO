import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../../db.js';
import { audit } from '../../lib/audit.js';
import { HttpError, idParam, notFound, parse } from '../../lib/http.js';
import { hashPassword } from '../../lib/password.js';
import { requireAuth, requireCsrfHeader, requireRole } from '../../lib/session.js';
import { uniqueSlug } from '../../lib/slug.js';
import {
  glossarySchema,
  interviewSchema,
  mediaUpdateSchema,
  moderationSchema,
  podcastSchema,
  settingsSchema,
  teamSchema,
  trendSchema,
  userCreateSchema,
  userUpdateSchema,
} from '../../schemas.js';
import { getSettings } from '../public.js';
import { crudRouter } from './crud.js';

export const adminRouter = Router();
adminRouter.use(requireCsrfHeader, requireAuth);

const adminOnly = requireRole('ADMIN');

/** Fecha de publicación: se fija la primera vez que algo pasa a PUBLICADO. */
function publishDate(status: 'DRAFT' | 'PUBLISHED', existing: Record<string, unknown> | null) {
  if (status !== 'PUBLISHED') return existing?.publishedAt ?? null;
  return existing?.publishedAt ?? new Date();
}

// ─── Resumen ───────────────────────────────────────────────────────────

adminRouter.get('/stats', async (_req, res) => {
  const [trends, trendDrafts, interviews, glossary, episodes, team, pending, approved, media, settings, recent] = await Promise.all([
    prisma.trend.count({ where: { status: 'PUBLISHED' } }),
    prisma.trend.count({ where: { status: 'DRAFT' } }),
    prisma.interview.count({ where: { status: 'PUBLISHED' } }),
    prisma.glossaryTerm.count({ where: { published: true } }),
    prisma.podcastEpisode.count({ where: { published: true } }),
    prisma.teamMember.count(),
    prisma.mailboxSubmission.count({ where: { status: 'PENDING' } }),
    prisma.mailboxSubmission.count({ where: { status: 'APPROVED' } }),
    prisma.media.count(),
    getSettings(),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { user: { select: { name: true } } } }),
  ]);
  // Pendientes de configuración que el resumen muestra como lista de tareas.
  const missing = [
    !settings.contactEmail && 'Correo de contacto',
    !settings.instagramUrl && 'Instagram',
    !settings.facebookUrl && 'Facebook',
    !settings.soundcloudProfile && 'Perfil de SoundCloud',
    !settings.logoId && 'Logo propio (se usa el logo por defecto)',
  ].filter(Boolean);
  res.json({ trends, trendDrafts, interviews, glossary, episodes, team, pending, approved, media, missing, recent });
});

// ─── Configuración del sitio (solo administración) ────────────────────

adminRouter.get('/settings', async (_req, res) => {
  res.json(await getSettings());
});

adminRouter.put('/settings', adminOnly, async (req, res) => {
  const data = parse(settingsSchema, req.body);
  const settings = await prisma.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  await audit(req.user?.id, 'update', 'settings', 1, 'Configuración del sitio');
  res.json(settings);
});

// ─── Contenidos ────────────────────────────────────────────────────────

adminRouter.use(
  '/team',
  crudRouter({
    entity: 'team',
    delegate: prisma.teamMember as never,
    schema: teamSchema,
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
    describe: (m) => String(m.name),
  }),
);

adminRouter.use(
  '/trends',
  crudRouter({
    entity: 'trend',
    delegate: prisma.trend as never,
    schema: trendSchema,
    orderBy: { updatedAt: 'desc' },
    listArgs: { omit: { origin: true, mechanism: true, impact: true, neutralView: true }, include: { author: { select: { name: true } } } },
    describe: (t) => String(t.title),
    prepare: async ({ slug, ...data }, { req, existing }) => ({
      ...data,
      slug: await uniqueSlug(slug || data.title, async (s) => Boolean(await prisma.trend.findFirst({ where: { slug: s, id: { not: (existing?.id as number) ?? 0 } } }))),
      publishedAt: publishDate(data.status, existing),
      authorId: (existing?.authorId as number | null | undefined) ?? req.user?.id,
    }),
  }),
);

adminRouter.use(
  '/interviews',
  crudRouter({
    entity: 'interview',
    delegate: prisma.interview as never,
    schema: interviewSchema,
    orderBy: { updatedAt: 'desc' },
    describe: (i) => `Entrevista a ${String(i.guestName)}`,
    prepare: async ({ slug, ...data }, { req, existing }) => ({
      ...data,
      slug: await uniqueSlug(slug || data.guestName, async (s) => Boolean(await prisma.interview.findFirst({ where: { slug: s, id: { not: (existing?.id as number) ?? 0 } } }))),
      publishedAt: publishDate(data.status, existing),
      authorId: (existing?.authorId as number | null | undefined) ?? req.user?.id,
    }),
  }),
);

adminRouter.use(
  '/glossary',
  crudRouter({
    entity: 'glossary',
    delegate: prisma.glossaryTerm as never,
    schema: glossarySchema,
    orderBy: [{ order: 'asc' }, { term: 'asc' }],
    describe: (g) => String(g.term),
    prepare: async (data, { existing }) => ({
      ...data,
      slug: await uniqueSlug(data.term, async (s) => Boolean(await prisma.glossaryTerm.findFirst({ where: { slug: s, id: { not: (existing?.id as number) ?? 0 } } }))),
    }),
  }),
);

adminRouter.use(
  '/podcast',
  crudRouter({
    entity: 'podcast',
    delegate: prisma.podcastEpisode as never,
    schema: podcastSchema,
    orderBy: [{ number: 'desc' }, { createdAt: 'desc' }],
    describe: (e) => String(e.title),
    prepare: (data, { existing }) => ({
      ...data,
      publishedAt: data.published ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
    }),
  }),
);

// ─── Buzón Comunitario (moderación) ───────────────────────────────────

adminRouter.get('/mailbox', async (req, res) => {
  const status = ['PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'].includes(String(req.query.status)) ? (req.query.status as never) : undefined;
  const items = await prisma.mailboxSubmission.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    include: { reviewedBy: { select: { name: true } } },
  });
  res.json(items);
});

adminRouter.patch('/mailbox/:id', async (req, res) => {
  const id = idParam(req.params.id);
  const data = parse(moderationSchema, req.body);
  const existing = await prisma.mailboxSubmission.findUnique({ where: { id } });
  if (!existing) throw notFound('El relato');
  if (data.status === 'APPROVED') {
    // Filtro editorial: no se aprueba sin permiso de publicación ni sin extracto revisado.
    if (!existing.allowPublication) throw new HttpError(400, 'Esta persona no autorizó publicar su relato. Puedes archivarlo.');
    if (!data.publicExcerpt) throw new HttpError(400, 'Revisa los campos marcados.', { publicExcerpt: 'Escribe el extracto que se publicará.' });
  }
  const updated = await prisma.mailboxSubmission.update({
    where: { id },
    data: { ...data, reviewedById: req.user!.id, reviewedAt: new Date() },
    include: { reviewedBy: { select: { name: true } } },
  });
  await audit(req.user?.id, `mailbox:${data.status.toLowerCase()}`, 'mailbox', id, `Relato #${id}`);
  res.json(updated);
});

adminRouter.delete('/mailbox/:id', adminOnly, async (req, res) => {
  const id = idParam(req.params.id);
  await prisma.mailboxSubmission.delete({ where: { id } });
  await audit(req.user?.id, 'delete', 'mailbox', id, `Relato #${id}`);
  res.json({ ok: true });
});

// ─── Medios ────────────────────────────────────────────────────────────

const ALLOWED_IMAGES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    // SVG queda fuera a propósito: puede traer scripts y se sirve desde nuestro dominio.
    if (ALLOWED_IMAGES.includes(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, 'Formato no permitido. Usa PNG, JPG, WEBP, AVIF o GIF.'));
  },
});

const mediaSelect = { id: true, filename: true, mimeType: true, size: true, alt: true, createdAt: true, uploadedBy: { select: { name: true } } };

adminRouter.get('/media', async (_req, res) => {
  res.json(await prisma.media.findMany({ orderBy: { createdAt: 'desc' }, select: mediaSelect }));
});

adminRouter.post('/media', (req, res, next) => {
  upload.single('file')(req, res, async (err: unknown) => {
    try {
      if (err) {
        if ((err as { code?: string }).code === 'LIMIT_FILE_SIZE') throw new HttpError(413, 'La imagen supera los 5 MB.');
        throw err;
      }
      if (!req.file) throw new HttpError(400, 'Selecciona una imagen.');
      const alt = typeof req.body?.alt === 'string' ? req.body.alt.trim().slice(0, 300) : '';
      const media = await prisma.media.create({
        data: { filename: req.file.originalname.slice(0, 200), mimeType: req.file.mimetype, size: req.file.size, alt, data: new Uint8Array(req.file.buffer), uploadedById: req.user!.id },
        select: mediaSelect,
      });
      await audit(req.user?.id, 'create', 'media', media.id, media.filename);
      res.status(201).json(media);
    } catch (error) {
      next(error);
    }
  });
});

adminRouter.patch('/media/:id', async (req, res) => {
  const { alt } = parse(mediaUpdateSchema, req.body);
  res.json(await prisma.media.update({ where: { id: idParam(req.params.id) }, data: { alt }, select: mediaSelect }));
});

adminRouter.delete('/media/:id', async (req, res) => {
  const id = idParam(req.params.id);
  // Las referencias (logo, portadas, fotos) quedan en null por onDelete: SetNull.
  const removed = await prisma.media.delete({ where: { id }, select: { filename: true } });
  await audit(req.user?.id, 'delete', 'media', id, removed.filename);
  res.json({ ok: true });
});

// ─── Usuarios y roles (solo administración) ───────────────────────────

const userSelect = { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true };

adminRouter.get('/users', adminOnly, async (_req, res) => {
  res.json(await prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: userSelect }));
});

adminRouter.post('/users', adminOnly, async (req, res) => {
  const { password, ...data } = parse(userCreateSchema, req.body);
  const user = await prisma.user.create({ data: { ...data, passwordHash: await hashPassword(password) }, select: userSelect });
  await audit(req.user?.id, 'create', 'user', user.id, `${user.name} (${user.role})`);
  res.status(201).json(user);
});

adminRouter.put('/users/:id', adminOnly, async (req, res) => {
  const id = idParam(req.params.id);
  const { password, ...data } = parse(userUpdateSchema, req.body);
  // Evita quedarse sin acceso: nadie se quita a sí mismo el rol ni se desactiva.
  if (id === req.user!.id && (data.role === 'EDITOR' || data.active === false)) {
    throw new HttpError(400, 'No puedes quitarte el rol de administración ni desactivar tu propia cuenta.');
  }
  const user = await prisma.user.update({
    where: { id },
    data: { ...data, ...(password ? { passwordHash: await hashPassword(password) } : {}) },
    select: userSelect,
  });
  await audit(req.user?.id, 'update', 'user', id, `${user.name} (${user.role}${user.active ? '' : ', desactivada'})`);
  res.json(user);
});

adminRouter.delete('/users/:id', adminOnly, async (req, res) => {
  const id = idParam(req.params.id);
  if (id === req.user!.id) throw new HttpError(400, 'No puedes eliminar tu propia cuenta.');
  const removed = await prisma.user.delete({ where: { id }, select: { name: true } });
  await audit(req.user?.id, 'delete', 'user', id, removed.name);
  res.json({ ok: true });
});

// ─── Historial ─────────────────────────────────────────────────────────

adminRouter.get('/audit', adminOnly, async (_req, res) => {
  res.json(await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { user: { select: { name: true } } } }));
});

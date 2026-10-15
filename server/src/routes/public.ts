import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma, type Platform } from '../db.js';
import { env } from '../env.js';
import { HttpError, idParam, notFound, parse } from '../lib/http.js';
import { submissionSchema } from '../schemas.js';

// API pública: solo lee contenido PUBLICADO. Lo único que escribe es el Buzón.
export const publicRouter = Router();

const published = { status: 'PUBLISHED' as const };
const author = { select: { name: true } };

export async function getSettings() {
  // La fila única se crea con valores por defecto si la base está vacía.
  return prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

publicRouter.get('/site', async (_req, res) => {
  res.json(await getSettings());
});

/** Todo lo que necesita la portada en una sola petición. */
publicRouter.get('/home', async (_req, res) => {
  const [settings, trends, interview, glossary, glossaryCount, episode, stories] = await Promise.all([
    getSettings(),
    prisma.trend.findMany({ where: published, orderBy: { publishedAt: 'desc' }, take: 3, omit: { origin: true, mechanism: true, impact: true, neutralView: true } }),
    prisma.interview.findFirst({ where: published, orderBy: { publishedAt: 'desc' } }),
    prisma.glossaryTerm.findMany({ where: { published: true }, orderBy: [{ order: 'asc' }, { term: 'asc' }], take: 3 }),
    prisma.glossaryTerm.count({ where: { published: true } }),
    prisma.podcastEpisode.findFirst({ where: { published: true }, orderBy: [{ publishedAt: 'desc' }, { number: 'desc' }] }),
    prisma.mailboxSubmission.count({ where: { status: 'APPROVED', allowPublication: true } }),
  ]);
  res.json({ settings, trends, interview, glossary, glossaryCount, episode, storiesCount: stories });
});

publicRouter.get('/team', async (_req, res) => {
  res.json(await prisma.teamMember.findMany({ where: { published: true }, orderBy: [{ order: 'asc' }, { id: 'asc' }] }));
});

const PLATFORMS: Platform[] = ['TIKTOK', 'INSTAGRAM', 'MULTIPLATFORM'];

publicRouter.get('/trends', async (req, res) => {
  const platform = PLATFORMS.includes(req.query.platform as Platform) ? (req.query.platform as Platform) : undefined;
  const trends = await prisma.trend.findMany({
    where: { ...published, platform },
    orderBy: { publishedAt: 'desc' },
    omit: { origin: true, mechanism: true, impact: true, neutralView: true },
    include: { author },
  });
  res.json(trends);
});

publicRouter.get('/trends/:slug', async (req, res) => {
  const trend = await prisma.trend.findFirst({ where: { ...published, slug: req.params.slug }, include: { author } });
  if (!trend) throw notFound('La nota');
  const related = await prisma.trend.findMany({
    where: { ...published, id: { not: trend.id } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: { id: true, slug: true, title: true, summary: true, platform: true, coverId: true, publishedAt: true },
  });
  res.json({ ...trend, related });
});

publicRouter.get('/interviews', async (_req, res) => {
  res.json(
    await prisma.interview.findMany({
      where: published,
      orderBy: { publishedAt: 'desc' },
      select: { id: true, slug: true, guestName: true, guestHandle: true, guestBio: true, photoId: true, intro: true, question1: true, publishedAt: true },
    }),
  );
});

publicRouter.get('/interviews/:slug', async (req, res) => {
  const interview = await prisma.interview.findFirst({ where: { ...published, slug: req.params.slug }, include: { author } });
  if (!interview) throw notFound('La entrevista');
  res.json(interview);
});

publicRouter.get('/glossary', async (_req, res) => {
  res.json(await prisma.glossaryTerm.findMany({ where: { published: true }, orderBy: [{ order: 'asc' }, { term: 'asc' }] }));
});

publicRouter.get('/podcast', async (_req, res) => {
  res.json(await prisma.podcastEpisode.findMany({ where: { published: true }, orderBy: [{ publishedAt: 'desc' }, { number: 'desc' }] }));
});

/** Relatos aprobados: solo el extracto editado por el equipo, nunca el texto original. */
publicRouter.get('/mailbox/stories', async (_req, res) => {
  const stories = await prisma.mailboxSubmission.findMany({
    where: { status: 'APPROVED', allowPublication: true, publicExcerpt: { not: null } },
    orderBy: { reviewedAt: 'desc' },
    take: 24,
    select: { id: true, anonymous: true, alias: true, topic: true, publicExcerpt: true, reviewedAt: true },
  });
  res.json(stories.map(({ anonymous, alias, ...rest }) => ({ ...rest, signature: anonymous || !alias ? 'Anónimo' : alias })));
});

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.isTest ? 1000 : 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Recibimos varios relatos desde tu conexión. Intenta nuevamente en una hora.' },
});

publicRouter.post('/mailbox', submissionLimiter, async (req, res) => {
  const { consent: _consent, website: _website, story, ...data } = parse(submissionSchema, req.body);
  // No guardamos IP ni datos técnicos: solo lo que la persona escribió.
  await prisma.mailboxSubmission.create({ data: { ...data, story, consentAt: new Date() } });
  res.status(201).json({ ok: true });
});

/** Imágenes guardadas en Postgres. El id nunca cambia de contenido: caché larga. */
publicRouter.get('/media/:id', async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: idParam(req.params.id) } });
  if (!media) throw new HttpError(404, 'Imagen no encontrada.');
  res.set({
    'Content-Type': media.mimeType,
    'Content-Length': String(media.size),
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Disposition': `inline; filename="${encodeURIComponent(media.filename)}"`,
  });
  res.end(Buffer.from(media.data));
});

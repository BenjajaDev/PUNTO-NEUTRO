import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma, type Platform } from '../db.js';
import { env } from '../env.js';
import { HttpError, idParam, notFound, parse } from '../lib/http.js';
import { screenSubmission } from '../lib/moderation.js';
import { OTHER_TOPIC, submissionSchema } from '../schemas.js';

// API pública: solo lee contenido PUBLICADO. Lo único que escribe es el Buzón.
export const publicRouter = Router();

const published = { status: 'PUBLISHED' as const };
const author = { select: { name: true } };
/** Perfil público de la autora (RF-04). */
const authorMember = { select: { id: true, name: true, role: true, bio: true, photoId: true } };
const longText = { origin: true, mechanism: true, impact: true, neutralView: true } as const;

export async function getSettings() {
  // La fila única se crea con valores por defecto si la base está vacía.
  return prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

publicRouter.get('/site', async (_req, res) => {
  res.json(await getSettings());
});

/** Todo lo que necesita la portada en una sola petición. */
publicRouter.get('/home', async (_req, res) => {
  const [settings, trends, interview, glossary, glossaryCount, episode, stories, reflections] = await Promise.all([
    getSettings(),
    prisma.trend.findMany({ where: published, orderBy: { publishedAt: 'desc' }, take: 3, omit: longText, include: { authorMember } }),
    prisma.interview.findFirst({ where: published, orderBy: { publishedAt: 'desc' } }),
    prisma.glossaryTerm.findMany({ where: { published: true }, orderBy: [{ order: 'asc' }, { term: 'asc' }], take: 3 }),
    prisma.glossaryTerm.count({ where: { published: true } }),
    prisma.podcastEpisode.findFirst({ where: { published: true }, orderBy: [{ publishedAt: 'desc' }, { number: 'desc' }] }),
    prisma.mailboxSubmission.count({ where: { status: 'APPROVED', allowPublication: true } }),
    prisma.reflection.findMany({ where: published, orderBy: { publishedAt: 'desc' }, take: 3, omit: { body: true } }),
  ]);
  res.json({ settings, trends, interview, glossary, glossaryCount, episode, storiesCount: stories, reflections });
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
    omit: longText,
    include: { author, authorMember },
  });
  res.json(trends);
});

publicRouter.get('/trends/:slug', async (req, res) => {
  const trend = await prisma.trend.findFirst({ where: { ...published, slug: req.params.slug }, include: { author, authorMember } });
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

// ─── Querer encajar ─────────────────────────────────────────────────────

const CATEGORIES = ['TRASTORNOS', 'PREJUICIOS', 'ESTRATEGIAS'] as const;
type Category = (typeof CATEGORIES)[number];

publicRouter.get('/reflections', async (req, res) => {
  const category = CATEGORIES.includes(req.query.category as Category) ? (req.query.category as Category) : undefined;
  res.json(
    await prisma.reflection.findMany({ where: { ...published, category }, orderBy: { publishedAt: 'desc' }, omit: { body: true }, include: { authorMember } }),
  );
});

publicRouter.get('/reflections/:slug', async (req, res) => {
  const item = await prisma.reflection.findFirst({ where: { ...published, slug: req.params.slug }, include: { authorMember } });
  if (!item) throw notFound('El artículo');
  const related = await prisma.reflection.findMany({
    where: { ...published, id: { not: item.id } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    omit: { body: true },
  });
  res.json({ ...item, related });
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
  // El tema libre de «Otros» lo escribió la persona: no se publica.
  res.json(
    stories.map(({ anonymous, alias, topic, ...rest }) => ({
      ...rest,
      topic: topic === OTHER_TOPIC ? null : topic,
      signature: anonymous || !alias ? 'Anónimo' : alias,
    })),
  );
});

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.isTest ? 1000 : 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Recibimos varios relatos desde tu conexión. Intenta nuevamente en una hora.' },
});

publicRouter.post('/mailbox', submissionLimiter, async (req, res) => {
  const { consent: _consent, acceptRules: _rules, website: _website, story, ...data } = parse(submissionSchema, req.body);
  // RF-02: el filtro marca para revisión humana; nunca rechaza.
  const screen = screenSubmission(`${story}\n${data.topicOther ?? ''}\n${data.alias ?? ''}`);
  const now = new Date();
  // No guardamos IP ni datos técnicos: solo lo que la persona escribió.
  await prisma.mailboxSubmission.create({
    data: { ...data, story, consentAt: now, acceptedRulesAt: now, flagged: screen.flagged, flagReasons: screen.reasons, flagMatches: screen.matches },
  });
  res.status(201).json({ ok: true });
});

/**
 * Favicon editable desde el panel. index.html apunta aquí, así funciona sin
 * JavaScript; sin favicon propio redirige al de por defecto del sitio.
 */
publicRouter.get('/favicon', async (_req, res) => {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 }, select: { faviconId: true } });
  const media = settings?.faviconId ? await prisma.media.findUnique({ where: { id: settings.faviconId } }) : null;
  if (!media) {
    res.set('Cache-Control', 'public, max-age=300').redirect(302, '/favicon.svg');
    return;
  }
  res.set({ 'Content-Type': media.mimeType, 'Content-Length': String(media.size), 'Cache-Control': 'public, max-age=300' });
  res.end(Buffer.from(media.data));
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

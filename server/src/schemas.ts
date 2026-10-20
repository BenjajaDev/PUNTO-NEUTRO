import { z } from 'zod';

// Esquemas de entrada compartidos por la API. Los textos se recortan y los
// campos opcionales aceptan "" (los formularios del panel siempre envían texto).

const tooLong = (max: number) => `Máximo ${max} caracteres.`;
const text = (max: number, min = 1) =>
  z
    .string('Campo obligatorio.')
    .trim()
    .min(min, min === 1 ? 'Campo obligatorio.' : `Escribe al menos ${min} caracteres.`)
    .max(max, tooLong(max));
const optText = (max: number) => z.string().trim().max(max, tooLong(max)).default('');
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^https?:\/\/[^\s]+$/i.test(v), 'Debe ser una URL completa (https://…).')
  .default('');
const mediaId = z.number().int().positive().nullable().optional();
const stringList = (maxItems: number, maxLen: number) => z.array(z.string().trim().min(1).max(maxLen)).max(maxItems).default([]);
const status = z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT');
const memberId = z.number().int().positive().nullable().optional();

/** Fuentes de respaldo de una nota: cita en formato libre (APA sugerido) y enlace opcional. */
export const referencesSchema = z
  .array(z.object({ citation: text(600, 5), url: optionalUrl }))
  .max(20, 'Máximo 20 referencias.')
  .default([]);

type Publishable = { status: 'DRAFT' | 'PUBLISHED'; references: unknown[]; authorMemberId?: number | null };

/** Reglas para publicar (RF-04): referencias siempre; autora cuando se exige. */
function publishRules(requireAuthor: boolean) {
  return (data: Publishable, ctx: z.RefinementCtx) => {
    if (data.status !== 'PUBLISHED') return;
    if (!data.references.length) ctx.addIssue({ code: 'custom', path: ['references'], message: 'Agrega al menos una referencia para publicar.' });
    if (requireAuthor && !data.authorMemberId) ctx.addIssue({ code: 'custom', path: ['authorMemberId'], message: 'Elige la autora para publicar.' });
  };
}

export const settingsSchema = z.object({
  siteName: text(80),
  tagline: optText(160),
  logoId: mediaId,
  siteTitle: text(120),
  metaDescription: optText(300),
  faviconId: mediaId,
  heroImageId: mediaId,
  aboutCoverId: mediaId,
  trendsCoverId: mediaId,
  interviewsCoverId: mediaId,
  glossaryCoverId: mediaId,
  reflectionsCoverId: mediaId,
  mailboxCoverId: mediaId,
  podcastCoverId: mediaId,
  communityRules: optText(3000),
  reflectionsIntro: optText(2000),
  heroTitle: optText(160),
  heroSubtitle: optText(400),
  whatIs: optText(3000),
  objective: optText(2000),
  mission: optText(2000),
  vision: optText(2000),
  aboutIntro: optText(3000),
  editorialLine: optText(3000),
  editorialPillars: stringList(8, 200),
  mailboxIntro: optText(2000),
  consentText: optText(3000),
  podcastName: text(120),
  podcastDescription: optText(2000),
  soundcloudProfile: optionalUrl,
  closingTitle: optText(160),
  closingText: optText(600),
  contactEmail: z.union([z.literal(''), z.email('Correo inválido.')]).default(''),
  contactPhone: optText(40),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{0,20}$/, 'Usa solo números (ej. +56 9 1234 5678).')
    .default(''),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  creditsText: optText(600),
  privacyPolicy: optText(12000),
});

export const teamSchema = z.object({
  name: text(120),
  role: text(160),
  bio: optText(2000),
  responsibilities: stringList(12, 200),
  photoId: mediaId,
  order: z.number().int().min(0).max(999).default(0),
  published: z.boolean().default(true),
});

export const trendSchema = z.object({
  title: text(160, 3),
  slug: z.string().trim().max(90).optional(),
  summary: text(400, 10),
  platform: z.enum(['TIKTOK', 'INSTAGRAM', 'MULTIPLATFORM']).default('MULTIPLATFORM'),
  tags: stringList(8, 40),
  coverId: mediaId,
  origin: text(8000, 10),
  mechanism: text(8000, 10),
  impact: text(8000, 10),
  neutralView: text(8000, 10),
  everydayExample: optText(1500),
  references: referencesSchema,
  capsuleUrl: optionalUrl,
  authorMemberId: memberId,
  status,
}).superRefine(publishRules(true));

export const reflectionSchema = z
  .object({
    title: text(160, 3),
    slug: z.string().trim().max(90).optional(),
    category: z.enum(['TRASTORNOS', 'PREJUICIOS', 'ESTRATEGIAS']),
    summary: text(400, 10),
    coverId: mediaId,
    body: text(20000, 50),
    keyIdeas: stringList(6, 200),
    everydayExample: optText(1500),
    references: referencesSchema,
    capsuleUrl: optionalUrl,
    authorMemberId: memberId,
    status,
  })
  .superRefine(publishRules(false));

export const interviewSchema = z.object({
  guestName: text(120, 2),
  slug: z.string().trim().max(90).optional(),
  guestHandle: optText(80),
  guestBio: optText(600),
  photoId: mediaId,
  intro: optText(1500),
  question1: text(300, 5),
  answer1: text(5000, 5),
  question2: text(300, 5),
  answer2: text(5000, 5),
  question3: text(300, 5),
  answer3: text(5000, 5),
  status,
});

export const glossarySchema = z.object({
  term: text(120),
  commonDefinition: text(1500, 5),
  bias: text(1500, 5),
  neutralReformulation: text(1500, 5),
  example: optText(600),
  order: z.number().int().min(0).max(999).default(0),
  published: z.boolean().default(true),
});

const SOUNDCLOUD = /^https:\/\/(www\.|m\.|on\.|api\.)?soundcloud\.com\/[^\s]+$/i;

export const podcastSchema = z.object({
  number: z.number().int().min(0).max(9999).nullable().optional(),
  title: text(160, 3),
  description: optText(2000),
  guests: optText(300),
  soundcloudUrl: z.string().trim().regex(SOUNDCLOUD, 'Pega el enlace del episodio en SoundCloud (https://soundcloud.com/…).'),
  durationMin: z.number().int().min(1).max(600).nullable().optional(),
  published: z.boolean().default(false),
});

export const AGE_RANGES = ['Menos de 18', '18 a 24', '25 a 34', '35 o más', 'Prefiero no decir'] as const;
export const OTHER_TOPIC = 'Otros';
export const TOPICS = ['Redes sociales y comparación', 'Comentarios sobre mi cuerpo', 'Alimentación', 'Filtros y edición de fotos', 'Ropa y tallas', 'Salud mental', OTHER_TOPIC] as const;
export const MODERATION_LABELS = ['Testimonio', 'Pasivo-agresivo', 'Ofensivo', 'Spam', 'Fuera de tema', 'Requiere contención', 'Derivar a especialista'] as const;

/** Formulario público del Buzón Comunitario. */
export const submissionSchema = z
  .object({
    anonymous: z.boolean().default(true),
    alias: z.string().trim().max(40).optional(),
    contactEmail: z.union([z.literal(''), z.email('Correo inválido.')]).optional(),
    ageRange: z.enum(AGE_RANGES).optional(),
    topic: z.enum(TOPICS, 'Elige un tema de la lista.').optional(),
    topicOther: z.string().trim().max(80, tooLong(80)).optional(),
    story: text(5000, 30),
    allowPublication: z.boolean().default(false),
    consent: z.literal(true, 'Debes aceptar el consentimiento informado para enviar tu relato.'),
    acceptRules: z.literal(true, 'Debes aceptar las normas de convivencia para enviar tu relato.'),
    // Trampa para bots: un humano nunca ve ni llena este campo.
    website: z.string().max(0, 'Campo inválido.').optional(),
  })
  .superRefine((data, ctx) => {
    // RF-01: «Otros» exige escribir el tema.
    if (data.topic === OTHER_TOPIC && (data.topicOther?.length ?? 0) < 3) {
      ctx.addIssue({ code: 'custom', path: ['topicOther'], message: 'Cuéntanos de qué tema se trata (mínimo 3 caracteres).' });
    }
  })
  .transform((data) => ({
    ...data,
    topicOther: data.topic === OTHER_TOPIC ? data.topicOther || null : null,
    // Anonimato estricto: si se marca, no guardamos nada que identifique.
    alias: data.anonymous ? null : data.alias || null,
    contactEmail: data.anonymous ? null : data.contactEmail || null,
  }));

export const moderationSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED']),
  publicExcerpt: z.string().trim().max(2000).optional(),
  editorNote: z.string().trim().max(2000).optional(),
  labels: z.array(z.enum(MODERATION_LABELS)).max(MODERATION_LABELS.length).optional(),
});

export const loginSchema = z.object({
  email: z.email('Correo inválido.').transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});

const password = z.string().min(10, 'Mínimo 10 caracteres.').max(200);

export const userCreateSchema = z.object({
  email: z.email('Correo inválido.').transform((v) => v.toLowerCase()),
  name: text(120, 2),
  role: z.enum(['ADMIN', 'EDITOR']),
  password,
});

export const userUpdateSchema = z.object({
  name: text(120, 2).optional(),
  role: z.enum(['ADMIN', 'EDITOR']).optional(),
  active: z.boolean().optional(),
  password: password.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual.'),
  newPassword: password,
});

export const mediaUpdateSchema = z.object({ alt: z.string().trim().max(300) });

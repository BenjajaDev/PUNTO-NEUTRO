// Tipos de las respuestas de la API (espejo del schema de Prisma).
export type Role = 'ADMIN' | 'EDITOR';
export type ContentStatus = 'DRAFT' | 'PUBLISHED';
export type Platform = 'TIKTOK' | 'INSTAGRAM' | 'MULTIPLATFORM';
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export type SiteSettings = {
  siteName: string;
  tagline: string;
  logoId: number | null;
  siteTitle: string;
  metaDescription: string;
  faviconId: number | null;
  heroImageId: number | null;
  aboutCoverId: number | null;
  trendsCoverId: number | null;
  interviewsCoverId: number | null;
  glossaryCoverId: number | null;
  reflectionsCoverId: number | null;
  mailboxCoverId: number | null;
  podcastCoverId: number | null;
  communityRules: string;
  reflectionsIntro: string;
  heroTitle: string;
  heroSubtitle: string;
  whatIs: string;
  objective: string;
  mission: string;
  vision: string;
  aboutIntro: string;
  editorialLine: string;
  editorialPillars: string[];
  mailboxIntro: string;
  consentText: string;
  podcastName: string;
  podcastDescription: string;
  soundcloudProfile: string;
  closingTitle: string;
  closingText: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  creditsText: string;
  privacyPolicy: string;
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  bio: string;
  responsibilities: string[];
  photoId: number | null;
  order: number;
  published: boolean;
};

export type Reference = { citation: string; url: string };
export type AuthorProfile = { id: number; name: string; role: string; bio: string; photoId: number | null };

export type TrendSummary = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  platform: Platform;
  tags: string[];
  coverId: number | null;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
  author?: { name: string } | null;
  authorMemberId: number | null;
  authorMember?: AuthorProfile | null;
};

export type Trend = TrendSummary & {
  origin: string;
  mechanism: string;
  impact: string;
  neutralView: string;
  everydayExample: string;
  references: Reference[];
  capsuleUrl: string;
  related?: TrendSummary[];
};

export type ReflectionCategory = 'TRASTORNOS' | 'PREJUICIOS' | 'ESTRATEGIAS';

export type ReflectionSummary = {
  id: number;
  slug: string;
  title: string;
  category: ReflectionCategory;
  summary: string;
  coverId: number | null;
  keyIdeas: string[];
  everydayExample: string;
  references: Reference[];
  capsuleUrl: string;
  authorMemberId: number | null;
  authorMember?: AuthorProfile | null;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
};

export type Reflection = ReflectionSummary & { body: string; related?: ReflectionSummary[] };

// Espejo de InterviewCategory (server/prisma/schema.prisma).
export type InterviewCategory = 'EXPERTAS' | 'INFLUENCERS' | 'PERSONAS_COMUNES';

export type InterviewQuestion = { question: string; answer: string };

type InterviewBase = {
  id: number;
  slug: string;
  category: InterviewCategory;
  guestName: string;
  guestHandle: string;
  guestBio: string;
  photoId: number | null;
  intro: string;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
  author?: { name: string } | null;
};

/** Entrevista completa (detalle y panel): todas sus preguntas, en orden. */
export type Interview = InterviewBase & { questions: InterviewQuestion[] };

/** Listado y portada: solo la primera pregunta y cuántas son (sin respuestas). */
export type InterviewSummary = InterviewBase & { firstQuestion: string; questionCount: number };

export type GlossaryTerm = {
  id: number;
  slug: string;
  term: string;
  commonDefinition: string;
  bias: string;
  neutralReformulation: string;
  example: string;
  order: number;
  published: boolean;
};

export type PodcastEpisode = {
  id: number;
  number: number | null;
  title: string;
  summary: string;
  tags: string[];
  coverId: number | null;
  guests: string;
  soundcloudUrl: string;
  durationMin: number | null;
  published: boolean;
  publishedAt: string | null;
};

export type PublicStory = { id: number; topic: string | null; publicExcerpt: string; reviewedAt: string; signature: string };

export type Submission = {
  id: number;
  anonymous: boolean;
  alias: string | null;
  contactEmail: string | null;
  ageRange: string | null;
  topic: string | null;
  topicOther: string | null;
  story: string;
  allowPublication: boolean;
  consentAt: string;
  acceptedRulesAt: string | null;
  flagged: boolean;
  flagReasons: string[];
  flagMatches: string[];
  labels: string[];
  status: SubmissionStatus;
  publicExcerpt: string | null;
  editorNote: string | null;
  reviewedAt: string | null;
  reviewedBy: { name: string } | null;
  createdAt: string;
};

export type MediaItem = { id: number; filename: string; mimeType: string; size: number; alt: string; createdAt: string; uploadedBy: { name: string } | null };

export type User = { id: number; email: string; name: string; role: Role };
export type UserRow = User & { active: boolean; lastLoginAt: string | null; createdAt: string };

export type AuditEntry = { id: number; action: string; entity: string; entityId: string | null; summary: string; createdAt: string; user: { name: string } | null };

export type HomeData = {
  settings: SiteSettings;
  trends: TrendSummary[];
  interview: InterviewSummary | null;
  glossary: GlossaryTerm[];
  glossaryCount: number;
  episode: PodcastEpisode | null;
  storiesCount: number;
  reflections: ReflectionSummary[];
};

export type Stats = {
  trends: number;
  trendDrafts: number;
  interviews: number;
  glossary: number;
  episodes: number;
  team: number;
  pending: number;
  approved: number;
  media: number;
  missing: string[];
  recent: AuditEntry[];
  reflections: number;
  flaggedPending: number;
  trendsMissingAuthor: { id: number; title: string }[];
};

export const PLATFORM_LABEL: Record<Platform, string> = { TIKTOK: 'TikTok', INSTAGRAM: 'Instagram', MULTIPLATFORM: 'TikTok + Instagram' };
export const AGE_RANGES = ['Menos de 18', '18 a 24', '25 a 34', '35 o más', 'Prefiero no decir'];
// Espejo de server/src/schemas.ts (TOPICS y MODERATION_LABELS).
export const OTHER_TOPIC = 'Otros';
export const TOPICS = ['Redes sociales y comparación', 'Comentarios sobre mi cuerpo', 'Alimentación', 'Filtros y edición de fotos', 'Ropa y tallas', 'Salud mental', OTHER_TOPIC];
export const MODERATION_LABELS = ['Testimonio', 'Pasivo-agresivo', 'Ofensivo', 'Spam', 'Fuera de tema', 'Requiere contención', 'Derivar a especialista'];
export const REFLECTION_CATEGORY: Record<ReflectionCategory, string> = {
  TRASTORNOS: 'Trastornos de salud mental',
  PREJUICIOS: 'Prejuicios de la mente',
  ESTRATEGIAS: 'Manejo emocional',
};

/** Categorías de Pequeñas Entrevistas: orden de las pestañas y textos de cada sección. */
export const INTERVIEW_CATEGORIES: { key: InterviewCategory; slug: string; label: string; singular: string; description: string }[] = [
  { key: 'EXPERTAS', slug: 'expertas', label: 'Expertas', singular: 'Experta', description: 'Especialistas en psicología, salud y comunicación explican lo que hay detrás de la presión por encajar.' },
  { key: 'INFLUENCERS', slug: 'influencers', label: 'Influencers', singular: 'Influencer', description: 'Creadoras de contenido cuentan cómo viven el escrutinio público y la presión estética en redes.' },
  { key: 'PERSONAS_COMUNES', slug: 'personas-comunes', label: 'Personas comunes', singular: 'Persona común', description: 'Voces cotidianas: estudiantes, trabajadoras, madres, hijas. Experiencias reales lejos de las cámaras.' },
];
export const INTERVIEW_CATEGORY_LABEL = Object.fromEntries(INTERVIEW_CATEGORIES.map((c) => [c.key, c.singular])) as Record<InterviewCategory, string>;

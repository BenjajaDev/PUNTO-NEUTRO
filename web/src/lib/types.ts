// Tipos de las respuestas de la API (espejo del schema de Prisma).
export type Role = 'ADMIN' | 'EDITOR';
export type ContentStatus = 'DRAFT' | 'PUBLISHED';
export type Platform = 'TIKTOK' | 'INSTAGRAM' | 'MULTIPLATFORM';
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export type SiteSettings = {
  siteName: string;
  tagline: string;
  logoId: number | null;
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
};

export type Trend = TrendSummary & {
  origin: string;
  mechanism: string;
  impact: string;
  neutralView: string;
  related?: TrendSummary[];
};

export type Interview = {
  id: number;
  slug: string;
  guestName: string;
  guestHandle: string;
  guestBio: string;
  photoId: number | null;
  intro: string;
  question1: string;
  answer1: string;
  question2: string;
  answer2: string;
  question3: string;
  answer3: string;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
  author?: { name: string } | null;
};

export type GlossaryTerm = {
  id: number;
  slug: string;
  term: string;
  commonDefinition: string;
  bias: string;
  neutralReformulation: string;
  order: number;
  published: boolean;
};

export type PodcastEpisode = {
  id: number;
  number: number | null;
  title: string;
  description: string;
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
  story: string;
  allowPublication: boolean;
  consentAt: string;
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
  interview: Interview | null;
  glossary: GlossaryTerm[];
  glossaryCount: number;
  episode: PodcastEpisode | null;
  storiesCount: number;
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
};

export const PLATFORM_LABEL: Record<Platform, string> = { TIKTOK: 'TikTok', INSTAGRAM: 'Instagram', MULTIPLATFORM: 'TikTok + Instagram' };
export const AGE_RANGES = ['Menos de 18', '18 a 24', '25 a 34', '35 o más', 'Prefiero no decir'];

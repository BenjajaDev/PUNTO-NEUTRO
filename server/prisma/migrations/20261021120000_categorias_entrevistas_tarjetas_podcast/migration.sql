-- Categorías de entrevistas y tarjetas de podcast.
-- Escrita a mano a partir de `prisma migrate diff`, para no perder datos:
--   · la categoría es obligatoria, pero ya existen entrevistas;
--   · el resumen del episodio reemplaza a «description» (se renombra, no se borra).

-- ─── Entrevistas: categoría obligatoria ────────────────────────────────
CREATE TYPE "InterviewCategory" AS ENUM ('EXPERTAS', 'INFLUENCERS', 'PERSONAS_COMUNES');

-- Las entrevistas existentes nacieron del formato original de la propuesta
-- («creadoras de contenido e influencers»): quedan como INFLUENCERS. El valor
-- por defecto se quita enseguida para que las nuevas DEBAN elegir categoría.
ALTER TABLE "Interview" ADD COLUMN "category" "InterviewCategory" NOT NULL DEFAULT 'INFLUENCERS';
ALTER TABLE "Interview" ALTER COLUMN "category" DROP DEFAULT;

CREATE INDEX "Interview_category_status_publishedAt_idx" ON "Interview"("category", "status", "publishedAt");

-- ─── Podcast: tarjeta con carátula, resumen y palabras clave ──────────
ALTER TABLE "PodcastEpisode" RENAME COLUMN "description" TO "summary";
ALTER TABLE "PodcastEpisode" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PodcastEpisode" ADD COLUMN "coverId" INTEGER;
ALTER TABLE "PodcastEpisode" ADD CONSTRAINT "PodcastEpisode_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

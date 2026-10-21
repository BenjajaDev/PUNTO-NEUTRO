-- La categoría «Personas comunes» de las entrevistas pasa a llamarse «Mujeres».
-- Escrita a mano: `prisma migrate diff` recrea el enum y castea por texto, lo
-- que fallaría con las entrevistas ya guardadas en PERSONAS_COMUNES.
-- RENAME VALUE conserva los datos y no reescribe la tabla.
ALTER TYPE "InterviewCategory" RENAME VALUE 'PERSONAS_COMUNES' TO 'MUJERES';

-- Logo propio del pie de página (sin él se usa el de la cabecera).
ALTER TABLE "SiteSettings" ADD COLUMN "footerLogoId" INTEGER;

ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_footerLogoId_fkey" FOREIGN KEY ("footerLogoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

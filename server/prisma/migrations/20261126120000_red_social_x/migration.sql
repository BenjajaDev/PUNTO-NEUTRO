-- Enlace a X (ex Twitter) en el pie de página. Vacío = no se muestra.
ALTER TABLE "SiteSettings" ADD COLUMN "xUrl" TEXT NOT NULL DEFAULT '';

-- Secciones activables desde Configuración del sitio. La lista empieza vacía:
-- en bases ya inicializadas todo sigue visible hasta que alguien apague una.
CREATE TYPE "SiteSection" AS ENUM ('ABOUT', 'TRENDS', 'INTERVIEWS', 'GLOSSARY', 'REFLECTIONS', 'MAILBOX', 'PODCAST');

ALTER TABLE "SiteSettings" ADD COLUMN "disabledSections" "SiteSection"[] DEFAULT ARRAY[]::"SiteSection"[];

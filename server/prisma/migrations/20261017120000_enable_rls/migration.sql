-- Supabase expone el esquema "public" por su Data API (PostgREST) con la
-- llave pública "anon". La API de Punto Neutro no la usa (habla con Postgres
-- vía Prisma como dueña de las tablas), pero sin RLS cualquiera con esa llave
-- podría leer usuarios, relatos del buzón o el historial.
--
-- RLS activado y sin políticas = la Data API no ve ninguna fila. La dueña de
-- las tablas (Prisma) no se ve afectada. En Postgres local o en Render esto es
-- inocuo. Toda tabla nueva debe activarlo en su propia migración (lo revisa
-- server/tests/db.test.ts).
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trend" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Interview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GlossaryTerm" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PodcastEpisode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MailboxSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Segunda capa, solo donde existen los roles de Supabase: quitarles los
-- permisos sobre lo que ya existe y sobre lo que creen futuras migraciones.
DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
    END IF;
  END LOOP;
END $$;

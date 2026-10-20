-- Entrevistas con preguntas dinámicas: las tres preguntas fijas pasan a una
-- lista [{ "question", "answer" }] donde el equipo agrega las que quiera.
-- Escrita a mano a partir de `prisma migrate diff`, para no perder datos:
-- primero se copian las preguntas existentes y recién después se quitan las
-- columnas antiguas.

ALTER TABLE "Interview" ADD COLUMN "questions" JSONB NOT NULL DEFAULT '[]';

-- Se conservan en orden; un par totalmente vacío no se copia.
UPDATE "Interview" SET "questions" = (
  SELECT COALESCE(jsonb_agg(jsonb_build_object('question', t.q, 'answer', t.a) ORDER BY t.n), '[]'::jsonb)
  FROM (VALUES (1, "question1", "answer1"), (2, "question2", "answer2"), (3, "question3", "answer3")) AS t(n, q, a)
  WHERE btrim(t.q) <> '' OR btrim(t.a) <> ''
);

ALTER TABLE "Interview"
  DROP COLUMN "question1",
  DROP COLUMN "answer1",
  DROP COLUMN "question2",
  DROP COLUMN "answer2",
  DROP COLUMN "question3",
  DROP COLUMN "answer3";

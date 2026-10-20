-- CreateEnum
CREATE TYPE "ReflectionCategory" AS ENUM ('TRASTORNOS', 'PREJUICIOS', 'ESTRATEGIAS');

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "aboutCoverId" INTEGER,
ADD COLUMN     "communityRules" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "faviconId" INTEGER,
ADD COLUMN     "glossaryCoverId" INTEGER,
ADD COLUMN     "heroImageId" INTEGER,
ADD COLUMN     "interviewsCoverId" INTEGER,
ADD COLUMN     "mailboxCoverId" INTEGER,
ADD COLUMN     "metaDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "podcastCoverId" INTEGER,
ADD COLUMN     "reflectionsCoverId" INTEGER,
ADD COLUMN     "reflectionsIntro" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "siteTitle" TEXT NOT NULL DEFAULT 'Punto Neutro · Periodismo sobre neutralidad corporal',
ADD COLUMN     "trendsCoverId" INTEGER;

-- AlterTable
ALTER TABLE "Trend" ADD COLUMN     "authorMemberId" INTEGER,
ADD COLUMN     "capsuleUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "everydayExample" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "references" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "GlossaryTerm" ADD COLUMN     "example" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "MailboxSubmission" ADD COLUMN     "acceptedRulesAt" TIMESTAMP(3),
ADD COLUMN     "flagMatches" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "flagReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "flagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "topicOther" TEXT;

-- CreateTable
CREATE TABLE "Reflection" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ReflectionCategory" NOT NULL DEFAULT 'ESTRATEGIAS',
    "summary" TEXT NOT NULL,
    "coverId" INTEGER,
    "body" TEXT NOT NULL,
    "keyIdeas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "everydayExample" TEXT NOT NULL DEFAULT '',
    "references" JSONB NOT NULL DEFAULT '[]',
    "capsuleUrl" TEXT NOT NULL DEFAULT '',
    "authorMemberId" INTEGER,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reflection_slug_key" ON "Reflection"("slug");

-- CreateIndex
CREATE INDEX "Reflection_status_publishedAt_idx" ON "Reflection"("status", "publishedAt");

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_faviconId_fkey" FOREIGN KEY ("faviconId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_heroImageId_fkey" FOREIGN KEY ("heroImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_aboutCoverId_fkey" FOREIGN KEY ("aboutCoverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_trendsCoverId_fkey" FOREIGN KEY ("trendsCoverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_interviewsCoverId_fkey" FOREIGN KEY ("interviewsCoverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_glossaryCoverId_fkey" FOREIGN KEY ("glossaryCoverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_reflectionsCoverId_fkey" FOREIGN KEY ("reflectionsCoverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_mailboxCoverId_fkey" FOREIGN KEY ("mailboxCoverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_podcastCoverId_fkey" FOREIGN KEY ("podcastCoverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trend" ADD CONSTRAINT "Trend_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Seguridad: toda tabla nueva con RLS (ver 20261017120000_enable_rls) ───
ALTER TABLE "Reflection" ENABLE ROW LEVEL SECURITY;

-- ─── Contenido para bases ya inicializadas ───────────────────────────────
-- Solo rellena campos vacíos: nunca pisa lo que el equipo ya editó.

UPDATE "SiteSettings" SET "communityRules" = 'Escribe desde tu experiencia, en primera persona.
Cuida a las demás personas: sin insultos, burlas ni comentarios sobre cuerpos ajenos.
No compartas nombres, usuarios, lugares ni datos que identifiquen a alguien (tampoco a ti).
Los mensajes con violencia, acoso o tono despectivo —incluidos los «consejos» que juzgan— no se publican.
El equipo revisa cada relato antes de publicar un extracto: puede etiquetarlo, editarlo o descartarlo.
Si estás pasando por un momento difícil, pide ayuda: Salud Responde 600 360 7777 o la línea *4141.' WHERE "communityRules" = '';
UPDATE "SiteSettings" SET "reflectionsIntro" = 'Querer encajar es humano, pero cuando la presión social se instala en la mente puede volverse un juicio constante. En esta sección hablamos de salud mental, de los prejuicios que nuestra propia mente produce y de estrategias concretas para cuidarnos. La información es educativa y no reemplaza la atención de profesionales de la salud.' WHERE "reflectionsIntro" = '';
UPDATE "Trend" SET "everydayExample" = 'Martina tiene 16 años. Antes de ir al colegio mira tres videos de «rutina de mañana clean girl». Llega a clases sintiendo que su cara «sin hacer nada» no basta, aunque nadie le ha dicho nada. Esa sensación no viene de su piel: viene de compararse con rostros iluminados y editados.' WHERE "slug" = 'clean-girl' AND "everydayExample" = '';
UPDATE "Trend" SET "references" = '[{"citation": "Fardouly, J., Diedrichs, P. C., Vartanian, L. R., & Halliwell, E. (2015). Social comparisons on social media: The impact of Facebook on young women''s body image concerns and mood. Body Image, 13, 38–45.", "url": "https://doi.org/10.1016/j.bodyim.2014.12.002"}, {"citation": "Fredrickson, B. L., & Roberts, T.-A. (1997). Objectification theory: Toward understanding women''s lived experiences and mental health risks. Psychology of Women Quarterly, 21(2), 173–206.", "url": "https://doi.org/10.1111/j.1471-6402.1997.tb00108.x"}]'::jsonb WHERE "slug" = 'clean-girl' AND "references" = '[]'::jsonb;
UPDATE "Trend" SET "everydayExample" = 'En un grupo de WhatsApp alguien comparte una nota: «Vuelve la moda de los 90: lo delgado está de vuelta». Una amiga responde con un emoji y otra escribe «tengo que dejar el pan». Parece una broma, pero así es como una tendencia de moda se convierte en una exigencia sobre el cuerpo.' WHERE "slug" = 'heroin-chic-revival' AND "everydayExample" = '';
UPDATE "Trend" SET "references" = '[{"citation": "Grabe, S., Ward, L. M., & Hyde, J. S. (2008). The role of the media in body image concerns among women: A meta-analysis of experimental and correlational studies. Psychological Bulletin, 134(3), 460–476.", "url": "https://doi.org/10.1037/0033-2909.134.3.460"}, {"citation": "Fredrickson, B. L., & Roberts, T.-A. (1997). Objectification theory: Toward understanding women''s lived experiences and mental health risks. Psychology of Women Quarterly, 21(2), 173–206.", "url": "https://doi.org/10.1111/j.1471-6402.1997.tb00108.x"}]'::jsonb WHERE "slug" = 'heroin-chic-revival' AND "references" = '[]'::jsonb;
UPDATE "Trend" SET "everydayExample" = 'Catalina abre la cámara frontal para una videollamada y, por costumbre, activa el filtro que le afina la nariz. Cuando se lo saca por error, siente que «se ve rara». Su cara no cambió: cambió la referencia con la que se mira.' WHERE "slug" = 'filtros-de-alteracion-facial' AND "everydayExample" = '';
UPDATE "Trend" SET "references" = '[{"citation": "Rajanala, S., Maymone, M. B. C., & Vashi, N. A. (2018). Selfies—Living in the era of filtered photographs. JAMA Facial Plastic Surgery, 20(6), 443–444.", "url": "https://doi.org/10.1001/jamafacial.2018.0486"}, {"citation": "Fardouly, J., Diedrichs, P. C., Vartanian, L. R., & Halliwell, E. (2015). Social comparisons on social media: The impact of Facebook on young women''s body image concerns and mood. Body Image, 13, 38–45.", "url": "https://doi.org/10.1016/j.bodyim.2014.12.002"}]'::jsonb WHERE "slug" = 'filtros-de-alteracion-facial' AND "references" = '[]'::jsonb;
UPDATE "GlossaryTerm" SET "example" = 'En la once familiar: «¿Y? ¿Ya estás preparando el cuerpo para el verano?»' WHERE "slug" = 'cuerpo-de-verano' AND "example" = '';
UPDATE "GlossaryTerm" SET "example" = '«¡Estás más flaca, te ves regia!»: un halago que, sin querer, supone que antes no lo estabas.' WHERE "slug" = 'flaca-gorda' AND "example" = '';
UPDATE "GlossaryTerm" SET "example" = 'Revisar tres veces cómo sale tu cuerpo en una foto grupal antes de disfrutar el momento en que fue tomada.' WHERE "slug" = 'autoobjetivacion' AND "example" = '';

-- Artículos iniciales de «Querer encajar» (publicados; el equipo puede editarlos).
INSERT INTO "Reflection" ("slug", "title", "category", "summary", "body", "keyIdeas", "everydayExample", "references", "status", "publishedAt", "updatedAt")
VALUES ('cuando-la-mente-se-vuelve-juez', 'Cuando la mente se vuelve juez: distorsiones que alimentan el querer encajar', 'PREJUICIOS'::"ReflectionCategory", 'Comparación constante, lectura de mente, filtro negativo: reconocer los atajos con que la mente nos juzga es el primer paso para desactivarlos.', 'La presión por encajar no solo viene de afuera. Con el tiempo, la mente aprende a repetir por su cuenta los mensajes que escucha en redes, en la familia o en el colegio, y empieza a juzgarnos antes de que nadie más lo haga. La psicología cognitiva llama a estos atajos «distorsiones cognitivas»: formas habituales y poco precisas de interpretar lo que nos pasa.

## Algunas distorsiones frecuentes
- Comparación constante: medir el propio valor según cómo se ven otras personas, casi siempre en fotos seleccionadas y editadas.
- Lectura de mente: dar por hecho lo que los demás piensan de nuestro cuerpo («todos se fijaron en mis brazos»).
- Filtro negativo: notar solo lo que no nos gusta e ignorar todo lo demás.
- Pensamiento de todo o nada: «si no me veo perfecta, me veo mal».
- Los «debería»: reglas rígidas sobre cómo tendría que ser o verse una persona.

## Por qué importan
Estas interpretaciones no son señales de debilidad: son hábitos aprendidos. El problema aparece cuando se vuelven tan automáticas que las confundimos con la realidad y empiezan a decidir qué ropa usamos, a qué lugares vamos o cómo comemos.

## Qué podemos hacer
Detectar el pensamiento, ponerle nombre y preguntarse qué evidencia real lo sostiene. No se trata de reemplazarlo a la fuerza por uno positivo, sino de mirarlo con más distancia: «estoy comparándome otra vez» es muy distinto de «me veo mal».', ARRAY['Los pensamientos automáticos no son hechos: son interpretaciones.', 'En redes nos comparamos con versiones seleccionadas y editadas de otras personas.', 'Ponerle nombre a una distorsión ayuda a tomar distancia de ella.']::TEXT[], 'Sales de una fiesta convencida de que todos comentaron tu ropa. Al día siguiente, nadie lo menciona. La mente rellenó el silencio con su peor suposición: eso es «lectura de mente».', '[{"citation": "Beck, A. T. (1976). Cognitive therapy and the emotional disorders. International Universities Press.", "url": ""}, {"citation": "Burns, D. D. (1980). Feeling good: The new mood therapy. William Morrow.", "url": ""}, {"citation": "Festinger, L. (1954). A theory of social comparison processes. Human Relations, 7(2), 117–140.", "url": "https://doi.org/10.1177/001872675400700202"}, {"citation": "Fardouly, J., Diedrichs, P. C., Vartanian, L. R., & Halliwell, E. (2015). Social comparisons on social media: The impact of Facebook on young women''s body image concerns and mood. Body Image, 13, 38–45.", "url": "https://doi.org/10.1016/j.bodyim.2014.12.002"}]'::jsonb, 'PUBLISHED', CURRENT_TIMESTAMP - INTERVAL '0 day', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Reflection" ("slug", "title", "category", "summary", "body", "keyIdeas", "everydayExample", "references", "status", "publishedAt", "updatedAt")
VALUES ('tca-y-dismorfia-senales-para-pedir-ayuda', 'Trastornos de la conducta alimentaria y dismorfia corporal: señales para pedir ayuda', 'TRASTORNOS'::"ReflectionCategory", 'Cuándo la preocupación por el cuerpo deja de ser pasajera y se convierte en un problema de salud que merece acompañamiento profesional.', 'Preocuparse a veces por la apariencia es común. Pero hay momentos en que esa preocupación ocupa gran parte del día, genera sufrimiento intenso y empieza a afectar la alimentación, los estudios, el trabajo o las relaciones. En esos casos puede tratarse de un problema de salud mental que necesita atención profesional.

## Trastornos de la conducta alimentaria (TCA)
Los TCA, como la anorexia nerviosa, la bulimia nerviosa o el trastorno por atracón, son condiciones de salud complejas en las que influyen factores biológicos, psicológicos y sociales. No se definen por un peso ni por una apariencia: pueden afectar a personas con cuerpos muy distintos.

## Dismorfia corporal
El trastorno dismórfico corporal implica una preocupación persistente por defectos que la persona percibe en su apariencia y que para los demás son mínimos o no se notan. Suele acompañarse de conductas repetitivas, como revisarse en el espejo, compararse o buscar aprobación constante.

## Señales para conversar con alguien
- Pensar en comida, peso o apariencia la mayor parte del día.
- Saltarse comidas, compensar lo que se come o sentir culpa intensa al comer.
- Evitar actividades, fotos o lugares por cómo se percibe el cuerpo.
- Revisarse o compararse muchas veces al día y sentirse peor después.
- Cambios de ánimo, aislamiento o irritabilidad relacionados con la imagen corporal.

Si te reconoces en varias de estas señales, conversarlo con una persona de confianza y con profesionales de la salud es un paso valioso. En Chile puedes llamar a Salud Responde (600 360 7777) para recibir orientación.', ARRAY['Los TCA y la dismorfia corporal son problemas de salud mental, no caprichos ni falta de voluntad.', 'Pedir ayuda a tiempo favorece la recuperación.', 'No hace falta «estar muy mal» para consultar.']::TEXT[], 'Una amiga deja de ir a la playa con el grupo «porque no tiene ganas». Con el tiempo notas que también evita los almuerzos. Preguntarle con cariño cómo está, sin comentar su cuerpo, puede abrir una conversación importante.', '[{"citation": "American Psychiatric Association. (2022). Diagnostic and statistical manual of mental disorders (5.ª ed., texto revisado; DSM-5-TR).", "url": ""}, {"citation": "Organización Mundial de la Salud. (2022). Salud mental: fortalecer nuestra respuesta (nota descriptiva).", "url": "https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response"}]'::jsonb, 'PUBLISHED', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Reflection" ("slug", "title", "category", "summary", "body", "keyIdeas", "everydayExample", "references", "status", "publishedAt", "updatedAt")
VALUES ('estrategias-para-habitar-la-presion', 'Estrategias para habitar la presión por encajar', 'ESTRATEGIAS'::"ReflectionCategory", 'Herramientas cotidianas —desde ordenar lo que consumes en redes hasta hablarte con más amabilidad— para que la presión social no decida por ti.', 'No podemos apagar la presión social, pero sí podemos cambiar cómo nos relacionamos con ella. Estas estrategias no reemplazan la atención profesional: son prácticas sencillas que muchas personas encuentran útiles en el día a día.

## Ordena lo que consumes
- Deja de seguir o silencia cuentas que te hacen sentir peor contigo.
- Busca cuentas que muestren cuerpos y vidas diversas.
- Usa los recordatorios de tiempo de pantalla para notar cuándo el scroll se vuelve automático.

## Cambia la pregunta
En vez de «¿cómo me veo?», prueba con «¿qué me permitió hacer hoy mi cuerpo?». La neutralidad corporal propone poner atención en lo que el cuerpo hace y siente, no solo en cómo se ve.

## Háblate con autocompasión
Cuando aparezca la voz crítica, pregúntate qué le dirías a una amiga en tu lugar. La autocompasión consiste en reconocer que lo que sientes es humano y tratarte con la misma amabilidad que le ofrecerías a otra persona.

## Vuelve al cuerpo
Respirar lento por unos minutos, caminar o estirarte ayuda a bajar la intensidad de la emoción antes de decidir qué hacer con ella.

## Busca apoyo
Conversar con alguien de confianza o con profesionales de la salud mental es parte del cuidado. Si sientes que no puedes más, llama a la línea *4141 o a Salud Responde (600 360 7777).', ARRAY['Puedes elegir qué contenidos ves: el feed también se entrena.', 'La autocompasión no es conformismo: es tratarte como tratarías a una amiga.', 'Pedir apoyo es una estrategia, no un fracaso.']::TEXT[], 'Después de 40 minutos viendo videos de rutinas de ejercicio, te sientes peor que al empezar. Silenciar dos cuentas y salir a caminar diez minutos no lo resuelve todo, pero cambia el resto de la tarde.', '[{"citation": "Neff, K. D. (2003). Self-compassion: An alternative conceptualization of a healthy attitude toward oneself. Self and Identity, 2(2), 85–101.", "url": "https://doi.org/10.1080/15298860309032"}, {"citation": "Tylka, T. L., & Wood-Barcalow, N. L. (2015). What is and what is not positive body image? Conceptual foundations and construct definition. Body Image, 14, 118–129.", "url": ""}, {"citation": "Organización Mundial de la Salud. (2022). Salud mental: fortalecer nuestra respuesta (nota descriptiva).", "url": "https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response"}]'::jsonb, 'PUBLISHED', CURRENT_TIMESTAMP - INTERVAL '2 day', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

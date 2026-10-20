/**
 * Contenido inicial tomado de la «Propuesta de Arquitectura y Diseño Web:
 * Punto Neutro». Solo corre sobre una base nueva (ver main) y nunca pisa lo
 * que el equipo ya editó en el panel.
 *
 * Las entrevistas y episodios de ejemplo quedan como BORRADOR: no se publican
 * personas ni audios que no existen.
 */
import { prisma } from '../src/db.js';
import { hashPassword } from '../src/lib/password.js';
import { COMMUNITY_RULES, GLOSSARY_EXAMPLES, REFLECTIONS_INTRO, TREND_EXTRAS } from './seed-content.js';

const PRIVACY = `Punto Neutro es un proyecto de título periodístico de la carrera de Periodismo de la Universidad Autónoma de Chile. Esta política explica cómo tratamos la información que recibimos a través del Buzón Comunitario.

1. Qué datos recibimos
Solo lo que tú escribes en el formulario. Por defecto el envío es anónimo: no pedimos nombre, correo ni teléfono, y no registramos tu dirección IP ni datos técnicos de tu dispositivo. Si decides no ser anónima, puedes dejar un seudónimo y, de forma opcional, un correo para que el equipo te contacte.

2. Para qué los usamos
Para leer, comprender y —solo si lo autorizas expresamente— publicar un extracto de tu relato en el sitio. Antes de publicar, el equipo editorial revisa y adapta el texto para evitar cualquier dato que pueda identificarte, el sensacionalismo y la revictimización.

3. Quién accede
Únicamente el equipo editorial de Punto Neutro, mediante un panel con acceso protegido. No vendemos, cedemos ni compartimos tus relatos con terceros.

4. Cuánto tiempo los guardamos
Mientras dure el proyecto académico. Puedes pedir que eliminemos tu relato en cualquier momento escribiendo al correo de contacto e indicando la fecha aproximada de envío y alguna frase del texto.

5. Tus derechos
De acuerdo con la normativa chilena de protección de datos personales, puedes solicitar acceso, rectificación, cancelación u oposición respecto de tus datos.

6. Si estás en riesgo
El Buzón no es un servicio de emergencia ni reemplaza la atención profesional. Si necesitas ayuda inmediata, comunícate con Salud Responde (600 360 7777) o acude al servicio de urgencia más cercano.`;

async function main() {
  // En producción el seed corre en cada despliegue: si la base ya fue
  // inicializada no toca nada (aunque el equipo haya borrado contenido a propósito).
  // SEED_FORCE=1 rellena de nuevo solo lo que esté vacío.
  if (process.env.SEED_FORCE !== '1' && (await prisma.siteSettings.count()) > 0) {
    console.log('La base ya está inicializada: no se cargó contenido inicial.');
    return;
  }

  // ── Configuración institucional ──
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: 'Punto Neutro',
      tagline: 'Periodismo transmedia sobre neutralidad corporal',
      heroTitle: 'Tu cuerpo no es una tendencia',
      heroSubtitle:
        'Un espacio periodístico, reflexivo y libre de juicios para mirar con calma lo que las redes sociales nos dicen sobre los cuerpos.',
      whatIs:
        'Punto Neutro es un proyecto periodístico transmedia enfocado en la neutralidad corporal. Desmitificamos los cánones de belleza hegemónicos y cuestionamos el consumo acelerado de tendencias digitales en plataformas como TikTok e Instagram.',
      objective:
        'Proveer un espacio reflexivo, libre de juicios y fundamentado en investigación periodística para desarmar la autoobjetivación corporal y promover una relación equilibrada con la funcionalidad del cuerpo.',
      mission:
        'Informar, educar y abrir debates reflexivos con rigor ético y perspectiva de género sobre el impacto de las redes sociales en la percepción corporal de adolescentes y mujeres jóvenes.',
      vision:
        'Consolidarnos como un medio de comunicación digital y transmedia de referencia en Chile y Latinoamérica en torno a la neutralidad corporal, el periodismo con perspectiva de género y la alfabetización mediática frente a los algoritmos y cánones hegemónicos.',
      aboutIntro:
        'Somos un equipo editorial integrado por Anabel Duarte Leiva y Constanza Torres Muñoz, periodistas en formación con un marco ético riguroso y un compromiso explícito con la perspectiva de género.',
      editorialLine:
        'Adherimos a un periodismo empático y no culpabilizador, basado en evidencia científica, estudios de comunicación y diálogo multidisciplinario con especialistas.',
      editorialPillars: [
        'Periodismo empático y no culpabilizador',
        'Basado en evidencia científica y estudios de comunicación',
        'Diálogo multidisciplinario con especialistas',
        'Perspectiva de género en cada pieza',
      ],
      mailboxIntro:
        'Un espacio seguro y bidireccional donde mujeres y adolescentes pueden compartir sus relatos, vivencias y reflexiones sobre su relación con la imagen corporal.',
      consentText:
        'Entiendo que mi relato será leído únicamente por el equipo editorial de Punto Neutro. Si autorizo su publicación, el equipo podrá publicar un extracto editado que no incluya datos que me identifiquen. Puedo pedir que lo eliminen en cualquier momento.',
      communityRules: COMMUNITY_RULES,
      reflectionsIntro: REFLECTIONS_INTRO,
      podcastName: 'A Pausar el Filtro',
      podcastDescription:
        'Conversaciones profundas con expertas y expertos en psicología, salud y comunicación, que aterrizan conceptos complejos en un lenguaje cercano, empático y libre de tecnicismos excesivos.',
      closingTitle: '¿Conversamos?',
      closingText: 'Escríbenos, síguenos o comparte tu relato. Construyamos juntas una mirada más amable sobre los cuerpos.',
      creditsText: 'Proyecto de Título Periodístico Transmedia · Carrera de Periodismo, Universidad Autónoma de Chile.',
      privacyPolicy: PRIVACY,
    },
  });

  // ── Equipo ──
  if ((await prisma.teamMember.count()) === 0) {
    await prisma.teamMember.createMany({
      data: [
        {
          name: 'Anabel Duarte Leiva',
          role: 'Periodista · Investigación y producción transmedia',
          bio: 'Periodista en formación. Investiga tendencias virales y su impacto en la percepción corporal, con perspectiva de género.',
          responsibilities: ['Investigación de tendencias virales', 'Pauta periodística', 'Producción transmedia', 'Guionización audiovisual'],
          order: 1,
        },
        {
          name: 'Constanza Torres Muñoz',
          role: 'Periodista · Entrevistas y estrategia digital',
          bio: 'Periodista en formación. Conduce entrevistas en profundidad y lidera la estrategia de difusión en redes sociales.',
          responsibilities: ['Entrevistas en profundidad', 'Gestión estratégica de redes sociales', 'Producción del podcast', 'Edición de contenidos'],
          order: 2,
        },
      ],
    });
  }

  // ── Glosario (términos de la propuesta) ──
  if ((await prisma.glossaryTerm.count()) === 0) {
    await prisma.glossaryTerm.createMany({
      data: [
        {
          slug: 'cuerpo-de-verano',
          example: GLOSSARY_EXAMPLES['cuerpo-de-verano'],
          term: 'Cuerpo de verano',
          commonDefinition: 'Preparación física orientada a encajar en ropa ligera o traje de baño.',
          bias: 'Asocia la exposición corporal al cumplimiento de un estándar estético estacional.',
          neutralReformulation: 'Todos los cuerpos habitan el verano sin necesidad de validación o modificación.',
          order: 1,
        },
        {
          slug: 'flaca-gorda',
          example: GLOSSARY_EXAMPLES['flaca-gorda'],
          term: 'Flaca / Gorda (halago / insulto)',
          commonDefinition: 'Uso de la corporalidad como juicio moral o valorativo de belleza.',
          bias: 'Perpetúa la gordofobia y la idea de que la delgadez equivale a éxito o virtud.',
          neutralReformulation: 'Descriptores físicos neutros desprovistos de carga afectiva o juicio de valor.',
          order: 2,
        },
        {
          slug: 'autoobjetivacion',
          example: GLOSSARY_EXAMPLES['autoobjetivacion'],
          term: 'Autoobjetivación',
          commonDefinition: 'Ver el propio cuerpo como un objeto para ser mirado y juzgado por otros.',
          bias: 'Prioriza la apariencia externa sobre la vivencia interna y la salud mental.',
          neutralReformulation: 'Reconocimiento del cuerpo como vehículo funcional de experiencias, no de exhibición.',
          order: 3,
        },
      ],
    });
  }

  // ── Anatomía de un Trend (ejemplos de la propuesta) ──
  if ((await prisma.trend.count()) === 0) {
    const now = Date.now();
    const day = 86_400_000;
    await prisma.trend.createMany({
      data: [
        {
          slug: 'clean-girl',
          ...TREND_EXTRAS['clean-girl'],
          title: 'Clean girl: la naturalidad que exige trabajo',
          summary: 'Piel luminosa, moño tirante y «cero maquillaje» que en realidad requiere muchos productos. Desarmamos la estética que promete sencillez.',
          platform: 'MULTIPLATFORM',
          tags: ['Belleza', 'Skincare', 'Estética'],
          origin:
            'La etiqueta se popularizó en TikTok e Instagram como una estética de apariencia «sin esfuerzo»: piel uniforme y brillante, cejas peinadas, accesorios dorados y ropa neutra. Su difusión se aceleró con tutoriales y rutinas de mañana que muestran paso a paso cómo lograr ese aspecto.',
          mechanism:
            'El algoritmo premia videos breves, repetibles y aspiracionales. La comparación es constante: el feed muestra una sucesión de rostros con iluminación favorable y edición, que se vuelve la referencia de lo que sería «verse natural». La palabra «limpia» introduce, además, una oposición implícita con lo que no lo sería.',
          impact:
            'Cuando lo «natural» se convierte en un resultado que hay que producir, la apariencia sin intervención pasa a leerse como descuido. Esto puede intensificar la vigilancia del propio rostro, el gasto en productos y la sensación de no estar a la altura, especialmente en adolescentes.',
          neutralView:
            'Desde la neutralidad corporal, la piel no necesita verse de una forma particular para estar bien. Cuidarla puede ser una práctica de bienestar, no una prueba que aprobar. La pregunta útil no es «¿me veo limpia?», sino «¿cómo me siento y qué necesita mi cuerpo hoy?».',
          status: 'PUBLISHED',
          publishedAt: new Date(now - 2 * day),
        },
        {
          slug: 'heroin-chic-revival',
          ...TREND_EXTRAS['heroin-chic-revival'],
          title: 'Heroin chic revival: el regreso de la delgadez extrema',
          summary: 'Una estética de los 90 vuelve con otro nombre. Por qué su reaparición en redes merece una mirada crítica.',
          platform: 'INSTAGRAM',
          tags: ['Delgadez', 'Moda', 'Gordofobia'],
          origin:
            'El término nació en la moda de los años 90 para describir una estética de extrema delgadez, ojeras y palidez. En los últimos años, publicaciones de moda y cuentas de tendencias en redes sociales han hablado de su «regreso», asociado a nuevas siluetas y a la idea de que «lo delgado vuelve».',
          mechanism:
            'Las tendencias corporales se presentan como modas de temporada, como si los cuerpos pudieran cambiar al ritmo de la ropa. En redes, la repetición de imágenes de un mismo tipo de cuerpo instala un estándar y convierte la comparación en algo cotidiano.',
          impact:
            'Tratar la delgadez extrema como tendencia puede reforzar la gordofobia, normalizar restricciones alimentarias y presentar como deseable algo que pone en riesgo la salud. Las personas con historia de trastornos de la conducta alimentaria son especialmente vulnerables a este tipo de contenido.',
          neutralView:
            'Los cuerpos no son tendencias que entran y salen de temporada. La neutralidad corporal propone correr el foco desde cómo se ve el cuerpo hacia lo que nos permite hacer y vivir, y recordar que ningún cuerpo es un accesorio de moda.',
          status: 'PUBLISHED',
          publishedAt: new Date(now - 6 * day),
        },
        {
          slug: 'filtros-de-alteracion-facial',
          ...TREND_EXTRAS['filtros-de-alteracion-facial'],
          title: 'Filtros de alteración facial: el rostro que no existe',
          summary: 'Afinan la nariz, agrandan los ojos y borran la textura de la piel en tiempo real. ¿Qué pasa cuando el espejo es la cámara?',
          platform: 'TIKTOK',
          tags: ['Filtros', 'Rostro', 'Autoimagen'],
          origin:
            'Los filtros de realidad aumentada nacieron como juegos —orejas de animal, brillos— y evolucionaron hacia efectos de «embellecimiento» casi imperceptibles que modifican rasgos en tiempo real. Su uso se masificó en historias, videos cortos y videollamadas.',
          mechanism:
            'A diferencia de una foto editada, el filtro acompaña el movimiento y se siente como un reflejo. Al verse a diario con rasgos modificados, el rostro sin filtro empieza a percibirse como la versión «defectuosa». El contenido filtrado, además, suele circular sin aviso.',
          impact:
            'La exposición constante a una versión retocada del propio rostro puede aumentar la insatisfacción con la apariencia real y la autoobjetivación: mirarse desde afuera, como si se fuera una imagen para ser evaluada.',
          neutralView:
            'El rostro es, antes que una imagen, la parte del cuerpo con la que expresamos, comemos, hablamos y nos reímos. Reconocer el filtro como una herramienta de edición —y no como un espejo— ayuda a recuperar una relación más justa con la propia cara.',
          status: 'PUBLISHED',
          publishedAt: new Date(now - 10 * day),
        },
      ],
    });
  }

  // ── Entrevista de ejemplo (BORRADOR: estructura de tres preguntas) ──
  if ((await prisma.interview.count()) === 0) {
    await prisma.interview.create({
      data: {
        slug: 'entrevista-de-ejemplo',
        category: 'INFLUENCERS',
        guestName: 'Creadora invitada (ejemplo)',
        guestHandle: '@usuaria',
        guestBio: 'Reemplaza este borrador con los datos de la creadora de contenido entrevistada.',
        intro: 'Plantilla de Pequeñas Entrevistas: tres preguntas clave sobre escrutinio digital, presión estética y autocuidado.',
        question1: '¿Cómo vives el escrutinio público sobre tu cuerpo en redes sociales?',
        answer1: 'Respuesta de la entrevistada.',
        question2: '¿Has sentido presión por mantener cierta estética para tu contenido?',
        answer2: 'Respuesta de la entrevistada.',
        question3: '¿Qué herramientas de autocuidado usas para gestionar la exposición mediática?',
        answer3: 'Respuesta de la entrevistada.',
        status: 'DRAFT',
      },
    });
  }

  // ── Episodio de ejemplo (BORRADOR hasta tener el enlace real) ──
  if ((await prisma.podcastEpisode.count()) === 0) {
    await prisma.podcastEpisode.create({
      data: {
        number: 1,
        title: 'Episodio 1 (ejemplo): ¿Qué es la neutralidad corporal?',
        summary: 'Reemplaza este borrador con el enlace real del episodio en SoundCloud y publícalo desde el panel.',
        tags: ['Neutralidad corporal', 'Salud mental'],
        guests: 'Especialista invitada',
        soundcloudUrl: 'https://soundcloud.com/punto-neutro/episodio-1',
        durationMin: 30,
        published: false,
      },
    });
  }

  // ── Primera cuenta administradora ──
  if ((await prisma.user.count()) === 0) {
    const email = (process.env.SEED_ADMIN_EMAIL || 'admin@puntoneutro.cl').toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD || 'PuntoNeutro2026!';
    await prisma.user.create({ data: { email, name: 'Administración', role: 'ADMIN', passwordHash: await hashPassword(password) } });
    console.log(`Cuenta administradora creada: ${email} (cambia la contraseña al ingresar).`);
  }

  console.log('Seed listo.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

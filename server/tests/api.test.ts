import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { hashPassword } from '../src/lib/password.js';

const app = createApp();
const CSRF = { 'x-requested-with': 'punto-neutro' };
const PASSWORD = 'clave-de-prueba-123';

async function agentFor(role: 'ADMIN' | 'EDITOR') {
  const email = `${role.toLowerCase()}@test.cl`;
  await prisma.user.upsert({
    where: { email },
    update: { role, active: true },
    create: { email, name: role === 'ADMIN' ? 'Admin Test' : 'Editora Test', role, passwordHash: await hashPassword(PASSWORD) },
  });
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').set(CSRF).send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return agent;
}

const trendBody = {
  title: 'Clean girl de prueba',
  summary: 'Resumen suficientemente largo.',
  platform: 'TIKTOK',
  tags: ['Belleza'],
  origin: 'Origen del trend de prueba.',
  mechanism: 'Mecanismo algorítmico de prueba.',
  impact: 'Impacto psicológico de prueba.',
  neutralView: 'Mirada neutral de prueba.',
  status: 'DRAFT',
};

const REFERENCE = { citation: 'Fardouly, J. et al. (2015). Social comparisons on social media. Body Image, 13, 38–45.', url: 'https://doi.org/10.1016/j.bodyim.2014.12.002' };

async function memberId() {
  const member = (await prisma.teamMember.findFirst({ where: { name: 'Autora Test' } })) ?? (await prisma.teamMember.create({ data: { name: 'Autora Test', role: 'Periodista' } }));
  return member.id;
}

beforeEach(async () => {
  await prisma.mailboxSubmission.deleteMany();
  await prisma.trend.deleteMany();
  await prisma.reflection.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.media.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('API pública', () => {
  it('entrega la portada con la configuración creada por defecto', async () => {
    const res = await request(app).get('/api/home');
    expect(res.status).toBe(200);
    expect(res.body.settings.siteName).toBe('Punto Neutro');
    expect(Array.isArray(res.body.trends)).toBe(true);
  });

  it('no muestra notas en borrador', async () => {
    const editor = await agentFor('EDITOR');
    const created = await editor.post('/api/admin/trends').set(CSRF).send(trendBody);
    expect(created.status).toBe(201);
    expect((await request(app).get('/api/trends')).body).toHaveLength(0);
    expect((await request(app).get(`/api/trends/${created.body.slug}`)).status).toBe(404);
  });
});

describe('Buzón Comunitario', () => {
  const story = 'Este es un relato de prueba con más de treinta caracteres.';

  it('exige consentimiento informado y explica el error por campo', async () => {
    const res = await request(app).post('/api/mailbox').send({ story, consent: false });
    expect(res.status).toBe(400);
    expect(res.body.fields.consent).toMatch(/consentimiento/);
  });

  it('el anonimato descarta seudónimo y correo', async () => {
    const res = await request(app).post('/api/mailbox').send({ story, consent: true, acceptRules: true, anonymous: true, alias: 'Cami', contactEmail: 'cami@test.cl' });
    expect(res.status).toBe(201);
    const saved = await prisma.mailboxSubmission.findFirstOrThrow();
    expect(saved.alias).toBeNull();
    expect(saved.contactEmail).toBeNull();
  });

  it('rechaza bots que llenan el campo trampa', async () => {
    const res = await request(app).post('/api/mailbox').send({ story, consent: true, acceptRules: true, website: 'spam.com' });
    expect(res.status).toBe(400);
  });

  it('solo publica el extracto editado de relatos autorizados', async () => {
    await request(app).post('/api/mailbox').send({ story, consent: true, acceptRules: true, allowPublication: false });
    await request(app).post('/api/mailbox').send({ story, consent: true, acceptRules: true, allowPublication: true, anonymous: false, alias: 'Vale' });
    const [noPermission, withPermission] = await prisma.mailboxSubmission.findMany({ orderBy: { id: 'asc' } });
    const editor = await agentFor('EDITOR');

    const denied = await editor.patch(`/api/admin/mailbox/${noPermission.id}`).set(CSRF).send({ status: 'APPROVED', publicExcerpt: 'Extracto' });
    expect(denied.status).toBe(400);

    const missingExcerpt = await editor.patch(`/api/admin/mailbox/${withPermission.id}`).set(CSRF).send({ status: 'APPROVED' });
    expect(missingExcerpt.body.fields.publicExcerpt).toBeTruthy();

    const ok = await editor.patch(`/api/admin/mailbox/${withPermission.id}`).set(CSRF).send({ status: 'APPROVED', publicExcerpt: 'Extracto editado' });
    expect(ok.status).toBe(200);

    const stories = (await request(app).get('/api/mailbox/stories')).body;
    expect(stories).toEqual([expect.objectContaining({ publicExcerpt: 'Extracto editado', signature: 'Vale' })]);
    expect(stories[0].story).toBeUndefined();
  });
});

describe('Sesión y permisos', () => {
  it('rechaza credenciales incorrectas con un mensaje genérico', async () => {
    const res = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'nadie@test.cl', password: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Correo o contraseña incorrectos.');
  });

  it('el panel exige sesión y /me responde null sin sesión', async () => {
    expect((await request(app).get('/api/admin/stats')).status).toBe(401);
    const me = await request(app).get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body).toBeNull();
  });

  it('las escrituras del panel exigen la cabecera anti-CSRF', async () => {
    const admin = await agentFor('ADMIN');
    const res = await admin.post('/api/admin/trends').send(trendBody);
    expect(res.status).toBe(403);
  });

  it('una editora no puede cambiar la configuración ni ver usuarios', async () => {
    const editor = await agentFor('EDITOR');
    const settings = (await editor.get('/api/admin/settings')).body;
    expect((await editor.put('/api/admin/settings').set(CSRF).send(settings)).status).toBe(403);
    expect((await editor.get('/api/admin/users')).status).toBe(403);
  });

  it('la administración no puede quitarse su propio rol', async () => {
    const admin = await agentFor('ADMIN');
    const me = (await admin.get('/api/auth/me')).body;
    const res = await admin.put(`/api/admin/users/${me.id}`).set(CSRF).send({ role: 'EDITOR' });
    expect(res.status).toBe(400);
  });
});

describe('Contenidos', () => {
  it('genera slugs únicos y fija la fecha al publicar', async () => {
    const editor = await agentFor('EDITOR');
    const first = await editor.post('/api/admin/trends').set(CSRF).send({ ...trendBody, status: 'PUBLISHED', authorMemberId: await memberId(), references: [REFERENCE] });
    const second = await editor.post('/api/admin/trends').set(CSRF).send(trendBody);
    expect(first.body.slug).toBe('clean-girl-de-prueba');
    expect(second.body.slug).toBe('clean-girl-de-prueba-2');
    expect(first.body.publishedAt).toBeTruthy();
    expect(second.body.publishedAt).toBeNull();

    const publicTrend = await request(app).get('/api/trends/clean-girl-de-prueba');
    expect(publicTrend.status).toBe(200);
    expect(publicTrend.body.author.name).toBe('Editora Test');
    expect(publicTrend.body.authorMember).toMatchObject({ name: 'Autora Test', role: 'Periodista' });
    expect(publicTrend.body.references).toEqual([REFERENCE]);
  });

  it('valida la URL de SoundCloud del podcast', async () => {
    const editor = await agentFor('EDITOR');
    const res = await editor.post('/api/admin/podcast').set(CSRF).send({ title: 'Episodio', soundcloudUrl: 'https://youtube.com/x' });
    expect(res.status).toBe(400);
    expect(res.body.fields.soundcloudUrl).toMatch(/SoundCloud/);
  });

  it('registra los cambios en el historial', async () => {
    const admin = await agentFor('ADMIN');
    await admin.post('/api/admin/trends').set(CSRF).send(trendBody);
    const log = (await admin.get('/api/admin/audit')).body;
    expect(log[0]).toMatchObject({ action: 'create', entity: 'trend', summary: trendBody.title });
  });
});

describe('Medios en Postgres', () => {
  // PNG transparente de 1×1.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

  beforeAll(() => {
    expect(png.length).toBeGreaterThan(0);
  });

  it('sube una imagen y la entrega con caché larga', async () => {
    const editor = await agentFor('EDITOR');
    const up = await editor.post('/api/admin/media').set(CSRF).field('alt', 'Punto').attach('file', png, { filename: 'punto.png', contentType: 'image/png' });
    expect(up.status).toBe(201);
    const res = await request(app).get(`/api/media/${up.body.id}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['cache-control']).toContain('immutable');
  });

  it('rechaza SVG', async () => {
    const editor = await agentFor('EDITOR');
    const up = await editor
      .post('/api/admin/media')
      .set(CSRF)
      .attach('file', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), { filename: 'x.svg', contentType: 'image/svg+xml' });
    expect(up.status).toBe(400);
  });
});

describe('Secreto del proxy', () => {
  it('con PROXY_SECRET, rechaza llamadas sin el secreto y acepta las reenviadas', async () => {
    const { env } = await import('../src/env.js');
    env.proxySecret = 'secreto-de-prueba';
    try {
      const guarded = createApp();
      expect((await request(guarded).get('/api/site')).status).toBe(403);
      expect((await request(guarded).get('/api/site').set('x-proxy-secret', 'secreto-de-prueba')).status).toBe(200);
      expect((await request(guarded).get('/api/health')).status).toBe(200);
    } finally {
      env.proxySecret = '';
    }
  });
});

describe('RF-01 · Buzón: tema «Otros»', () => {
  const story = 'Este es un relato de prueba con más de treinta caracteres.';

  it('exige escribir el tema cuando se elige «Otros»', async () => {
    const res = await request(app).post('/api/mailbox').send({ story, consent: true, acceptRules: true, topic: 'Otros', topicOther: '' });
    expect(res.status).toBe(400);
    expect(res.body.fields.topicOther).toMatch(/tema/);
  });

  it('guarda el tema escrito y no lo publica', async () => {
    const ok = await request(app).post('/api/mailbox').send({ story, consent: true, acceptRules: true, topic: 'Otros', topicOther: 'Deporte escolar', allowPublication: true });
    expect(ok.status).toBe(201);
    const saved = await prisma.mailboxSubmission.findFirstOrThrow();
    expect(saved.topicOther).toBe('Deporte escolar');

    const editor = await agentFor('EDITOR');
    await editor.patch(`/api/admin/mailbox/${saved.id}`).set(CSRF).send({ status: 'APPROVED', publicExcerpt: 'Extracto' });
    const stories = (await request(app).get('/api/mailbox/stories')).body;
    expect(stories[0].topic).toBeNull();
  });

  it('descarta el tema libre si no se eligió «Otros»', async () => {
    await request(app).post('/api/mailbox').send({ story, consent: true, acceptRules: true, topic: 'Alimentación', topicOther: 'algo' });
    expect((await prisma.mailboxSubmission.findFirstOrThrow()).topicOther).toBeNull();
  });

  it('rechaza temas fuera de la lista', async () => {
    const res = await request(app).post('/api/mailbox').send({ story, consent: true, acceptRules: true, topic: 'Inventado' });
    expect(res.status).toBe(400);
  });
});

describe('RF-02 · Buzón: normas y moderación', () => {
  it('exige aceptar las normas de convivencia', async () => {
    const res = await request(app).post('/api/mailbox').send({ story: 'Un relato suficientemente largo para la prueba.', consent: true });
    expect(res.status).toBe(400);
    expect(res.body.fields.acceptRules).toMatch(/normas/);
  });

  it('marca (sin rechazar) mensajes pasivo-agresivos u ofensivos', async () => {
    const res = await request(app)
      .post('/api/mailbox')
      .send({ story: 'No es por ofender, pero las gordas exageradas deberían bajar de peso, idiotaaas.', consent: true, acceptRules: true });
    expect(res.status).toBe(201);
    const saved = await prisma.mailboxSubmission.findFirstOrThrow();
    expect(saved.flagged).toBe(true);
    expect(saved.flagReasons).toEqual(expect.arrayContaining(['Posible tono pasivo-agresivo', 'Insultos o lenguaje ofensivo (puede ser una cita)']));
    expect(saved.acceptedRulesAt).toBeTruthy();
  });

  it('un testimonio tranquilo no queda marcado', async () => {
    await request(app).post('/api/mailbox').send({ story: 'Aprendí a mirar mi cuerpo con más calma después de dejar de seguir cuentas de dietas.', consent: true, acceptRules: true });
    expect((await prisma.mailboxSubmission.findFirstOrThrow()).flagged).toBe(false);
  });

  it('el equipo puede etiquetar y filtrar los marcados', async () => {
    await request(app).post('/api/mailbox').send({ story: 'Con todo respeto, ustedes son unas ofendiditas por cualquier cosa.', consent: true, acceptRules: true });
    const saved = await prisma.mailboxSubmission.findFirstOrThrow();
    const editor = await agentFor('EDITOR');
    const res = await editor.patch(`/api/admin/mailbox/${saved.id}`).set(CSRF).send({ status: 'REJECTED', labels: ['Pasivo-agresivo'] });
    expect(res.body.labels).toEqual(['Pasivo-agresivo']);
    const flagged = (await editor.get('/api/admin/mailbox?flagged=true')).body;
    expect(flagged).toHaveLength(1);
    const bad = await editor.patch(`/api/admin/mailbox/${saved.id}`).set(CSRF).send({ status: 'REJECTED', labels: ['Inventada'] });
    expect(bad.status).toBe(400);
  });
});

describe('RF-03 · Querer encajar', () => {
  const body = {
    title: 'Cuando la mente se vuelve juez',
    category: 'PREJUICIOS',
    summary: 'Resumen suficientemente largo para la prueba.',
    body: 'Cuerpo del artículo con más de cincuenta caracteres para cumplir la validación mínima.',
    keyIdeas: ['Idea clave'],
  };

  it('publicar exige al menos una referencia', async () => {
    const editor = await agentFor('EDITOR');
    const res = await editor.post('/api/admin/reflections').set(CSRF).send({ ...body, status: 'PUBLISHED' });
    expect(res.status).toBe(400);
    expect(res.body.fields.references).toBeTruthy();
  });

  it('solo los artículos publicados son visibles', async () => {
    const editor = await agentFor('EDITOR');
    await editor.post('/api/admin/reflections').set(CSRF).send({ ...body, title: 'Borrador', status: 'DRAFT' });
    const pub = await editor.post('/api/admin/reflections').set(CSRF).send({ ...body, status: 'PUBLISHED', references: [REFERENCE] });
    expect(pub.status).toBe(201);
    const list = (await request(app).get('/api/reflections')).body;
    expect(list.map((r: { title: string }) => r.title)).toEqual([body.title]);
    expect(list[0].body).toBeUndefined();
    const detail = await request(app).get(`/api/reflections/${pub.body.slug}`);
    expect(detail.body.keyIdeas).toEqual(['Idea clave']);
    expect((await request(app).get('/api/reflections?category=TRASTORNOS')).body).toHaveLength(0);
  });
});

describe('RF-04 · Autoría y referencias en Anatomía de un Trend', () => {
  it('no se publica sin autora ni referencias', async () => {
    const editor = await agentFor('EDITOR');
    const res = await editor.post('/api/admin/trends').set(CSRF).send({ ...trendBody, status: 'PUBLISHED' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields)).toEqual(expect.arrayContaining(['authorMemberId', 'references']));
  });

  it('los borradores pueden guardarse incompletos', async () => {
    const editor = await agentFor('EDITOR');
    expect((await editor.post('/api/admin/trends').set(CSRF).send(trendBody)).status).toBe(201);
  });

  it('valida el formato de las referencias', async () => {
    const editor = await agentFor('EDITOR');
    const res = await editor.post('/api/admin/trends').set(CSRF).send({ ...trendBody, references: [{ citation: 'x', url: 'no-es-url' }] });
    expect(res.status).toBe(400);
  });
});

describe('Identidad editable', () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

  it('sin favicon propio redirige al de por defecto; con favicon lo entrega', async () => {
    await prisma.siteSettings.upsert({ where: { id: 1 }, update: { faviconId: null }, create: { id: 1 } });
    const fallback = await request(app).get('/api/favicon');
    expect(fallback.status).toBe(302);
    expect(fallback.headers.location).toBe('/favicon.svg');

    const admin = await agentFor('ADMIN');
    const up = await admin.post('/api/admin/media').set(CSRF).attach('file', png, { filename: 'icono.png', contentType: 'image/png' });
    const settings = (await admin.get('/api/admin/settings')).body;
    const saved = await admin.put('/api/admin/settings').set(CSRF).send({ ...settings, faviconId: up.body.id, siteTitle: 'Punto Neutro · Prueba', heroImageId: up.body.id });
    expect(saved.status).toBe(200);
    const icon = await request(app).get('/api/favicon');
    expect(icon.status).toBe(200);
    expect(icon.headers['content-type']).toBe('image/png');
    expect((await request(app).get('/api/site')).body).toMatchObject({ siteTitle: 'Punto Neutro · Prueba', heroImageId: up.body.id });
  });
});

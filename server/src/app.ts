import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { env } from './env.js';
import { errorHandler, notFoundApi } from './lib/http.js';
import { loadUser } from './lib/session.js';
import { adminRouter } from './routes/admin/index.js';
import { authRouter } from './routes/auth.js';
import { publicRouter } from './routes/public.js';

const here = dirname(fileURLToPath(import.meta.url));
const WEB_DIST = resolve(here, '../../web/dist');

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Saltos de proxy delante de la API (Cloudflare Pages + balanceador del hosting = 2).
  app.set('trust proxy', env.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'data:'],
          // Reproductor embebido de SoundCloud (sección Podcast).
          frameSrc: ['https://w.soundcloud.com'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: env.isProd ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(loadUser);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', publicRouter);
  app.use('/api', notFoundApi);

  // En producción el mismo servidor entrega el sitio compilado (web/dist).
  if (existsSync(WEB_DIST)) {
    app.use(express.static(WEB_DIST, { index: false, maxAge: '1h' }));
    app.use('/assets', express.static(resolve(WEB_DIST, 'assets'), { immutable: true, maxAge: '1y' }));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(resolve(WEB_DIST, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}

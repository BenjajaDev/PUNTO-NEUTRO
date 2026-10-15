import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { HttpError, parse } from '../lib/http.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { endSession, publicUser, requireAuth, requireCsrfHeader, startSession } from '../lib/session.js';
import { changePasswordSchema, loginSchema } from '../schemas.js';

export const authRouter = Router();
authRouter.use(requireCsrfHeader);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentar.' },
});

authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  // Mismo mensaje para correo inexistente y clave incorrecta (no revela cuentas).
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Correo o contraseña incorrectos.');
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSession(res, user);
  res.json(publicUser(user));
});

authRouter.post('/logout', (_req, res) => {
  endSession(res);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

authRouter.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = parse(changePasswordSchema, req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new HttpError(400, 'Revisa los campos marcados.', { currentPassword: 'La contraseña actual no coincide.' });
  }
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  res.json({ ok: true });
});

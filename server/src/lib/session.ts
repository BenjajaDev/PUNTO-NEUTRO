import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { prisma, type Role, type User } from '../db.js';
import { env } from '../env.js';
import { HttpError } from './http.js';

export const SESSION_COOKIE = 'pn_session';
const SESSION_HOURS = 8;
const secret = new TextEncoder().encode(env.jwtSecret);

export type SessionUser = Pick<User, 'id' | 'email' | 'name' | 'role'>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export const publicUser = (user: User): SessionUser => ({ id: user.id, email: user.email, name: user.name, role: user.role });

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProd,
  path: '/',
};

export async function startSession(res: Response, user: User) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret);
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_HOURS * 3600 * 1000 });
}

export function endSession(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

async function readSession(req: Request): Promise<SessionUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    // Se relee la cuenta en cada petición: desactivar a alguien o cambiar su
    // rol tiene efecto inmediato, sin esperar a que expire el token.
    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
    return user && user.active ? publicUser(user) : null;
  } catch {
    return null;
  }
}

export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  req.user = (await readSession(req)) ?? undefined;
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new HttpError(401, 'Tu sesión expiró. Vuelve a ingresar.'));
  next();
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new HttpError(403, 'Tu rol no tiene permiso para esta acción.'));
    next();
  };

/**
 * Defensa CSRF simple para la API del panel: los formularios de otros sitios
 * no pueden agregar cabeceras personalizadas, y la cookie es SameSite=Lax.
 */
export function requireCsrfHeader(req: Request, _res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  if (req.get('x-requested-with') !== 'punto-neutro') return next(new HttpError(403, 'Petición rechazada por seguridad.'));
  next();
}

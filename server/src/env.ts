// Variables de entorno validadas una sola vez al arrancar.
const isProd = process.env.NODE_ENV === 'production';

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Falta la variable de entorno ${name}. Revisa server/.env (ver .env.example).`);
  return value;
}

const jwtSecret = required('JWT_SECRET', isProd ? undefined : 'dev-secret-solo-para-desarrollo-local-123456');
if (isProd && jwtSecret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción.');

export const env = {
  isProd,
  isTest: process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST),
  port: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
};

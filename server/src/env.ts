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
  /** CA (PEM) para verificar el certificado de la base; Supabase usa una CA propia. */
  databaseSslCa: process.env.DATABASE_SSL_CA || undefined,
  jwtSecret,
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
  /** Si se define, la API solo acepta peticiones que traigan este secreto (las que reenvía Cloudflare Pages). */
  proxySecret: process.env.PROXY_SECRET || '',
};

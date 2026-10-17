import type { PoolConfig } from 'pg';

// Parámetros SSL de la URL que `pg` interpreta por su cuenta. Si quedan en la
// URL, pisan la opción `ssl` que armamos abajo (pg da prioridad a la URL).
const SSL_URL_PARAMS = ['sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat'];

/**
 * Configuración del pool de `pg` para una URL de Postgres.
 *
 * Supabase firma el certificado de su pooler con una CA propia, así que con
 * `sslmode=require` (que `pg` trata como verify-full) la conexión falla con
 * «self-signed certificate in certificate chain». Si recibimos esa CA
 * (`DATABASE_SSL_CA`), verificamos el certificado contra ella; sin CA, la URL
 * se usa tal cual (base local, Render, o `uselibpqcompat=true&sslmode=require`).
 */
export function pgConfig(connectionString: string, sslCa?: string): PoolConfig {
  if (!sslCa) return { connectionString };
  const url = new URL(connectionString);
  for (const param of SSL_URL_PARAMS) url.searchParams.delete(param);
  return { connectionString: url.toString(), ssl: { ca: normalizePem(sslCa), rejectUnauthorized: true } };
}

/** Algunos paneles de variables de entorno guardan el PEM en una sola línea con `\n` literales. */
function normalizePem(pem: string) {
  return pem.replace(/\\n/g, '\n').trim() + '\n';
}

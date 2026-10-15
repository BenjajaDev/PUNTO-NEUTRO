import { execSync } from 'node:child_process';

/**
 * Aplica las migraciones pendientes a la base de pruebas. Usa `migrate deploy`
 * (no destructivo): cada test limpia sus propias tablas en beforeEach.
 */
export default function setup() {
  try {
    process.loadEnvFile('.env');
  } catch {
    /* CI: variables ya presentes */
  }
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('Define TEST_DATABASE_URL (ver server/.env.example) para correr los tests.');
  if (url === process.env.DATABASE_URL) throw new Error('TEST_DATABASE_URL debe apuntar a una base distinta de DATABASE_URL.');
  execSync('pnpm prisma migrate deploy', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: url } });
}

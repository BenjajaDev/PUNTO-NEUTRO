import { defineConfig, env } from 'prisma/config';

// Prisma 7 no lee .env por sí solo: lo cargamos con la API nativa de Node.
try {
  process.loadEnvFile('.env');
} catch {
  /* sin .env: se usan las variables del entorno (CI, hosting) */
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  // Las migraciones toman un candado de sesión (advisory lock): con Supabase
  // deben ir por la conexión de sesión (DIRECT_URL, puerto 5432), no por el
  // pooler en modo transacción que usa la API (DATABASE_URL, puerto 6543).
  datasource: {
    url: process.env.DIRECT_URL || env('DATABASE_URL'),
  },
});

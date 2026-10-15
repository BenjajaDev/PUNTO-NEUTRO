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
  datasource: {
    url: env('DATABASE_URL'),
  },
});

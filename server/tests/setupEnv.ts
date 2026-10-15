// Se ejecuta antes de importar la app: apunta Prisma a la base de pruebas.
try {
  process.loadEnvFile('.env');
} catch {
  /* CI */
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.NODE_ENV = 'test';

// Se ejecuta antes de importar la app: apunta Prisma a la base de pruebas.
try {
  process.loadEnvFile('.env');
} catch {
  /* CI */
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
// Los tests nunca deben tocar la base real por la conexión directa ni con su CA.
delete process.env.DIRECT_URL;
delete process.env.DATABASE_SSL_CA;
process.env.NODE_ENV = 'test';

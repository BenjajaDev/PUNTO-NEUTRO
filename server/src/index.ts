import { createApp } from './app.js';
import { prisma } from './db.js';
import { env } from './env.js';

const server = createApp().listen(env.port, () => {
  console.log(`API de Punto Neutro en http://localhost:${env.port}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { env } from './env.js';

// Una sola instancia por proceso: cada PrismaClient abre su propio pool.
const adapter = new PrismaPg({ connectionString: env.databaseUrl });
export const prisma = new PrismaClient({ adapter });

export * from './generated/prisma/client.js';

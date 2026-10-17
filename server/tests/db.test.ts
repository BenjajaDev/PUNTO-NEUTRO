import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';

afterAll(() => prisma.$disconnect());

describe('base de datos', () => {
  // En Supabase, una tabla sin RLS queda legible con la llave pública "anon".
  it('todas las tablas de public tienen RLS activado', async () => {
    const rows = await prisma.$queryRaw<{ relname: string }[]>`
      SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
      ORDER BY c.relname`;
    expect(rows.map((r) => r.relname)).toEqual([]);
  });
});

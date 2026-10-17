import { describe, expect, it } from 'vitest';
import { pgConfig } from '../src/lib/pgConfig.js';

const SUPABASE = 'postgresql://postgres.abc:cl%40ve@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true';

describe('pgConfig', () => {
  it('sin CA deja la URL tal cual', () => {
    expect(pgConfig(SUPABASE)).toEqual({ connectionString: SUPABASE });
  });

  it('con CA quita los parámetros SSL de la URL (pg les da prioridad) y verifica contra la CA', () => {
    const config = pgConfig(SUPABASE, '-----BEGIN CERTIFICATE-----\nAAA\n-----END CERTIFICATE-----');
    expect(config.connectionString).toBe(
      'postgresql://postgres.abc:cl%40ve@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    );
    expect(config.ssl).toEqual({
      ca: '-----BEGIN CERTIFICATE-----\nAAA\n-----END CERTIFICATE-----\n',
      rejectUnauthorized: true,
    });
  });
});

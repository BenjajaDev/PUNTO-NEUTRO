/**
 * Copia todos los datos de una base de Punto Neutro a otra (ej. Render → Supabase).
 *
 *   SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... pnpm --filter server db:copy
 *
 * - Solo lee del origen. En el destino escribe todo en una transacción: si algo
 *   falla, el destino queda como estaba.
 * - El destino debe tener las mismas migraciones aplicadas (`db:deploy`) y
 *   estar vacío, para no mezclar contenidos ni duplicar cuentas.
 * - Si el destino necesita una CA propia (Supabase), define TARGET_DATABASE_SSL_CA.
 *
 * Funciona sin pg_dump/psql instalados (útil en Windows).
 */
import pg from 'pg';
import { pgConfig } from '../src/lib/pgConfig.js';

// Orden que respeta las claves foráneas: primero lo que otras tablas referencian.
// Si agregas un modelo, súmalo aquí (el script avisa si falta alguno).
const TABLES = [
  'User',
  'Media',
  'SiteSettings',
  'TeamMember',
  'Trend',
  'Reflection',
  'Interview',
  'GlossaryTerm',
  'PodcastEpisode',
  'MailboxSubmission',
  'AuditLog',
];

// Tablas cuyas filas iniciales las insertan las migraciones (no el seed): en un
// destino recién migrado ya traen contenido. Se reemplaza por el del origen
// (que puede haberse editado o borrado), dentro de la misma transacción.
const MIGRATION_CONTENT = ['Reflection'];

// Media guarda imágenes de hasta 5 MB: lotes chicos para no cargar cientos de MB en memoria.
const BATCH_SIZE: Record<string, number> = { Media: 5 };
const DEFAULT_BATCH = 200;

// Fechas y JSON como texto tal cual: las fechas no se corren por zona horaria, y
// el JSON no pasa por objetos de JS (pg enviaría un arreglo como array de
// Postgres y no como JSON). Postgres los vuelve a interpretar al insertar.
const RAW_TEXT_OIDS = new Set([1082, 1114, 1184, 114, 3802]);
const types = {
  getTypeParser: ((oid: number, format?: 'text' | 'binary') =>
    RAW_TEXT_OIDS.has(oid) ? (value: string) => value : pg.types.getTypeParser(oid, format)) as typeof pg.types.getTypeParser,
};

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name}.`);
  return value;
}

function hostOf(url: string) {
  try {
    const { hostname, port, pathname } = new URL(url);
    return `${hostname}${port ? `:${port}` : ''}${pathname}`;
  } catch {
    return '(URL inválida)';
  }
}

async function appliedMigrations(client: pg.Client) {
  const { rows } = await client.query<{ migration_name: string }>(
    `SELECT migration_name FROM "_prisma_migrations"
     WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`,
  );
  return rows.map((r) => r.migration_name);
}

async function publicTables(client: pg.Client) {
  const { rows } = await client.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`,
  );
  return rows.map((r) => r.table_name);
}

async function columnsOf(client: pg.Client, table: string) {
  const { rows } = await client.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
    [table],
  );
  return rows.map((r) => r.column_name);
}

async function count(client: pg.Client, table: string) {
  const { rows } = await client.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM "${table}"`);
  return rows[0].n;
}

async function copyTable(source: pg.Client, target: pg.Client, table: string) {
  const columns = await columnsOf(target, table);
  const columnList = columns.map((c) => `"${c}"`).join(', ');
  const batch = BATCH_SIZE[table] ?? DEFAULT_BATCH;
  let lastId: number | null = null;
  let copied = 0;

  for (;;) {
    const { rows }: { rows: Record<string, unknown>[] } = await source.query(
      `SELECT ${columnList} FROM "${table}" ${lastId === null ? '' : 'WHERE id > $1'} ORDER BY id LIMIT ${batch}`,
      lastId === null ? [] : [lastId],
    );
    if (rows.length === 0) break;

    const values: unknown[] = [];
    const tuples = rows.map((row) => {
      const placeholders = columns.map((c) => {
        values.push(row[c]);
        return `$${values.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    await target.query(`INSERT INTO "${table}" (${columnList}) VALUES ${tuples.join(', ')}`, values);

    copied += rows.length;
    lastId = Number(rows[rows.length - 1].id);
  }

  // Los ids se copiaron explícitos: el contador autoincremental debe seguir desde el mayor.
  await target.query(
    `SELECT setval(seq, COALESCE((SELECT MAX(id) FROM "${table}"), 1), (SELECT MAX(id) FROM "${table}") IS NOT NULL)
     FROM pg_get_serial_sequence('"${table}"', 'id') AS seq WHERE seq IS NOT NULL`,
  );
  return copied;
}

async function main() {
  const sourceUrl = required('SOURCE_DATABASE_URL');
  const targetUrl = required('TARGET_DATABASE_URL');
  if (sourceUrl === targetUrl) throw new Error('SOURCE_DATABASE_URL y TARGET_DATABASE_URL son la misma base.');

  const source = new pg.Client({ ...pgConfig(sourceUrl, process.env.SOURCE_DATABASE_SSL_CA), types });
  const target = new pg.Client({ ...pgConfig(targetUrl, process.env.TARGET_DATABASE_SSL_CA), types });
  await source.connect();
  await target.connect();
  console.log(`Origen:  ${hostOf(sourceUrl)}\nDestino: ${hostOf(targetUrl)}\n`);

  try {
    const [sourceMigrations, targetMigrations] = await Promise.all([appliedMigrations(source), appliedMigrations(target)]);
    if (sourceMigrations.join() !== targetMigrations.join()) {
      throw new Error(
        'Las dos bases no tienen las mismas migraciones aplicadas. Ejecuta `pnpm --filter server db:deploy` en ambas (con el mismo código) y vuelve a intentarlo.\n' +
          `  Origen:  ${sourceMigrations.join(', ') || '(ninguna)'}\n  Destino: ${targetMigrations.join(', ') || '(ninguna)'}`,
      );
    }

    const missing = (await publicTables(target)).filter((t) => !TABLES.includes(t));
    if (missing.length) throw new Error(`Hay tablas que el script no conoce: ${missing.join(', ')}. Agrégalas a TABLES en prisma/copy-data.ts.`);

    for (const table of TABLES) {
      if (MIGRATION_CONTENT.includes(table)) continue;
      if ((await count(target, table)) > 0) {
        throw new Error(
          `El destino ya tiene datos en "${table}". El script solo copia a una base vacía (con las migraciones aplicadas y sin seed).`,
        );
      }
    }

    // Lectura consistente del origen aunque la API siga recibiendo cambios.
    await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await target.query('BEGIN');
    try {
      for (const table of MIGRATION_CONTENT) await target.query(`DELETE FROM "${table}"`);
      for (const table of TABLES) {
        const copied = await copyTable(source, target, table);
        console.log(`  ${table.padEnd(18)} ${copied}`);
      }
      for (const table of TABLES) {
        const [a, b] = await Promise.all([count(source, table), count(target, table)]);
        if (a !== b) throw new Error(`"${table}" quedó con ${b} filas en el destino y el origen tiene ${a}.`);
      }
      await target.query('COMMIT');
    } catch (error) {
      await target.query('ROLLBACK');
      throw error;
    } finally {
      await source.query('ROLLBACK');
    }
    console.log('\nListo: datos copiados y verificados.');
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}

main().catch((error: unknown) => {
  console.error(`\nNo se copió nada: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

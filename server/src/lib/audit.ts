import { prisma } from '../db.js';

/** Registra quién cambió qué en el panel (página «Historial» para administración). */
export async function audit(userId: number | undefined, action: string, entity: string, entityId?: string | number, summary = '') {
  try {
    await prisma.auditLog.create({ data: { userId, action, entity, entityId: entityId === undefined ? undefined : String(entityId), summary } });
  } catch (error) {
    // El historial nunca debe impedir guardar un contenido.
    console.error('No se pudo registrar el historial', error);
  }
}

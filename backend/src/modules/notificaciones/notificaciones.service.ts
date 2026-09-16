import { prisma } from '../../config/prisma.js';

export class NotificacionError extends Error {

  statusCode: number;

  constructor(
    message: string,
    statusCode = 400
  ) {
    super(message);
    this.name = 'NotificacionError';
    this.statusCode = statusCode;
  }
}

/**
 * Devuelve las notificaciones del usuario
 * ordenadas desde la más reciente.
 */
export async function obtenerNotificaciones(
  userId: string
) {

  return prisma.notificacion.findMany({
    where: {
      userId
    },

    orderBy: {
      createdAt: 'desc'
    },

    take: 50
  });
}

/**
 * Devuelve cuántas notificaciones
 * todavía no ha leído el usuario.
 */
export async function obtenerCantidadNoLeidas(
  userId: string
) {

  return prisma.notificacion.count({
    where: {
      userId,
      leida: false
    }
  });
}

/**
 * Marca una notificación como leída.
 */
export async function marcarComoLeida(
  userId: string,
  id: string
) {

  const notificacion =
    await prisma.notificacion.findFirst({
      where: {
        id,
        userId
      }
    });

  if (!notificacion) {
    throw new NotificacionError(
      'Notificación no encontrada.',
      404
    );
  }

  return prisma.notificacion.update({
    where: {
      id
    },

    data: {
      leida: true
    }
  });
}

/**
 * Marca todas las notificaciones
 * del usuario como leídas.
 */
export async function marcarTodasComoLeidas(
  userId: string
) {

  await prisma.notificacion.updateMany({
    where: {
      userId,
      leida: false
    },

    data: {
      leida: true
    }
  });
}

/**
 * Elimina una notificación específica.
 */
export async function eliminarNotificacion(
  userId: string,
  id: string
) {

  const notificacion =
    await prisma.notificacion.findFirst({
      where: {
        id,
        userId
      }
    });

  if (!notificacion) {
    throw new NotificacionError(
      'Notificación no encontrada.',
      404
    );
  }

  await prisma.notificacion.delete({
    where: {
      id
    }
  });
}
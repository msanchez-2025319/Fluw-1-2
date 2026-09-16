import {
  Request,
  Response
} from 'express';

import {
  eliminarNotificacion,
  marcarComoLeida,
  marcarTodasComoLeidas,
  NotificacionError,
  obtenerCantidadNoLeidas,
  obtenerNotificaciones
} from './notificaciones.service.js';

function manejarError(
  error: unknown,
  res: Response
): void {

  if (
    error instanceof NotificacionError
  ) {

    res
      .status(error.statusCode)
      .json({
        message: error.message
      });

    return;
  }

  console.error(
    '[notificaciones]',
    error
  );

  res.status(500).json({
    message:
      'Error interno del servidor.'
  });
}

export async function listar(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId =
      req.user!.id;

    const [
      notificaciones,
      noLeidas
    ] = await Promise.all([
      obtenerNotificaciones(userId),
      obtenerCantidadNoLeidas(userId)
    ]);

    res.json({
      notificaciones,
      noLeidas
    });

  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}

export async function leer(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId =
      req.user!.id;

    const id =
      String(req.params.id);

    const notificacion =
      await marcarComoLeida(
        userId,
        id
      );

    res.json({
      message:
        'Notificación marcada como leída.',
      notificacion
    });

  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}

export async function leerTodas(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId =
      req.user!.id;

    await marcarTodasComoLeidas(
      userId
    );

    res.json({
      message:
        'Notificaciones marcadas como leídas.'
    });

  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}

export async function eliminar(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId =
      req.user!.id;

    const id =
      String(req.params.id);

    await eliminarNotificacion(
      userId,
      id
    );

    res.json({
      message:
        'Notificación eliminada correctamente.'
    });

  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}
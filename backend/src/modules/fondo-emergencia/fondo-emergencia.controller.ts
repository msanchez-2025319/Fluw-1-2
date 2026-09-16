import {
  Request,
  Response
} from "express";

import {
  actualizarFondoEmergencia,
  crearFondoEmergencia,
  eliminarFondoEmergencia,
  FondoEmergenciaError,
  obtenerFondoEmergencia
} from "./fondo-emergencia.service.js";

function manejarError(
  error: unknown,
  res: Response
): Response {

  if (
    error instanceof
    FondoEmergenciaError
  ) {
    return res
      .status(error.statusCode)
      .json({
        message: error.message
      });
  }

  console.error(
    "[FONDO EMERGENCIA]",
    error
  );

  return res
    .status(500)
    .json({
      message:
        "Error interno del servidor."
    });
}

export async function obtener(
  req: Request,
  res: Response
): Promise<Response> {

  try {

    const userId =
      req.user!.id;

    const fondo =
      await obtenerFondoEmergencia(
        userId
      );

    return res.status(200).json({
      fondo
    });

  } catch (error) {

    return manejarError(
      error,
      res
    );
  }
}

export async function crear(
  req: Request,
  res: Response
): Promise<Response> {

  try {

    const userId =
      req.user!.id;

    const {
      monto,
      tipoCuota
    } = req.body;

    const fondo =
      await crearFondoEmergencia(
        userId,
        {
          monto,
          tipoCuota
        }
      );

    return res.status(201).json({
      message:
        "Fondo de emergencia creado correctamente.",

      fondo
    });

  } catch (error) {

    return manejarError(
      error,
      res
    );
  }
}

export async function actualizar(
  req: Request,
  res: Response
): Promise<Response> {

  try {

    const userId =
      req.user!.id;

    const {
      monto,
      tipoCuota
    } = req.body;

    const fondo =
      await actualizarFondoEmergencia(
        userId,
        {
          monto,
          tipoCuota
        }
      );

    return res.status(200).json({
      message:
        "Fondo de emergencia actualizado correctamente.",

      fondo
    });

  } catch (error) {

    return manejarError(
      error,
      res
    );
  }
}

export async function eliminar(
  req: Request,
  res: Response
): Promise<Response> {

  try {

    const userId =
      req.user!.id;

    await eliminarFondoEmergencia(
      userId
    );

    return res.status(200).json({
      message:
        "Fondo de emergencia eliminado correctamente."
    });

  } catch (error) {

    return manejarError(
      error,
      res
    );
  }
}
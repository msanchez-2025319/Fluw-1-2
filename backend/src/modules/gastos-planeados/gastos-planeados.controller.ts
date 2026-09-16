import {
  Request,
  Response
} from "express";

import {
  actualizarGastoPlaneado,
  crearGastoPlaneado,
  eliminarGastoPlaneado,
  GastoPlaneadoError,
  obtenerGastoPlaneado
} from "./gastos-planeados.service.js";

function manejarError(
  error: unknown,
  res: Response
): Response {

  if (
    error instanceof
    GastoPlaneadoError
  ) {
    return res
      .status(
        error.statusCode
      )
      .json({
        message:
          error.message
      });
  }

  console.error(
    "[GASTOS PLANEADOS]",
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

    const gastoPlaneado =
      await obtenerGastoPlaneado(
        userId
      );

    return res
      .status(200)
      .json({
        gastoPlaneado
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

    const gastoPlaneado =
      await crearGastoPlaneado(
        userId,
        {
          monto,
          tipoCuota
        }
      );

    return res
      .status(201)
      .json({
        message:
          "Gasto planeado creado correctamente.",

        gastoPlaneado
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

    const gastoPlaneado =
      await actualizarGastoPlaneado(
        userId,
        {
          monto,
          tipoCuota
        }
      );

    return res
      .status(200)
      .json({
        message:
          "Gasto planeado actualizado correctamente.",

        gastoPlaneado
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

    await eliminarGastoPlaneado(
      userId
    );

    return res
      .status(200)
      .json({
        message:
          "Gasto planeado eliminado correctamente."
      });

  } catch (error) {

    return manejarError(
      error,
      res
    );
  }
}
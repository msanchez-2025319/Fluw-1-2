import type {
  Request,
  Response
} from "express";

import {
  PresupuestoImpuestoError,
  actualizarPresupuestoImpuesto,
  crearPresupuestoImpuesto,
  eliminarPresupuestoImpuesto,
  obtenerPresupuestoImpuesto
} from "./presupuesto-impuestos.service.js";

function manejarError(
  error: unknown,
  res: Response
): void {

  if (
    error instanceof
    PresupuestoImpuestoError
  ) {
    res.status(
      error.statusCode
    ).json({
      message: error.message
    });

    return;
  }

  console.error(
    "[PRESUPUESTO IMPUESTOS]",
    error
  );

  res.status(500).json({
    message:
      "Error interno del servidor"
  });
}

export async function obtener(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId =
      req.user!.id;

    const presupuesto =
      await obtenerPresupuestoImpuesto(
        userId
      );

    res.status(200).json({
      presupuesto
    });

  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}

export async function crear(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId =
      req.user!.id;

    const {
      monto
    } = req.body;

    const presupuesto =
      await crearPresupuestoImpuesto(
        userId,
        monto
      );

    res.status(201).json({
      message:
        "Presupuesto de impuestos guardado correctamente",

      presupuesto
    });

  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}

export async function actualizar(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId =
      req.user!.id;

    const {
      monto
    } = req.body;

    const presupuesto =
      await actualizarPresupuestoImpuesto(
        userId,
        monto
      );

    res.status(200).json({
      message:
        "Presupuesto de impuestos actualizado correctamente",

      presupuesto
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

    await eliminarPresupuestoImpuesto(
      userId
    );

    res.status(200).json({
      message:
        "Presupuesto de impuestos eliminado correctamente"
    });

  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}
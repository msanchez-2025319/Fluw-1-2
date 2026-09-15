import type {
  Request,
  Response,
} from "express";

import {
  crearAhorro,
  obtenerAhorro,
  actualizarAhorro,
  eliminarAhorro,
  AhorroError,
} from "./ahorros.service.js";

function manejarError(
  error: unknown,
  res: Response
) {
  if (error instanceof AhorroError) {
    return res
      .status(error.statusCode)
      .json({
        message: error.message,
      });
  }

  console.error(
    "[ahorros] Error inesperado:",
    error
  );

  return res.status(500).json({
    message: "Error interno del servidor",
  });
}

export async function crear(
  req: Request,
  res: Response
) {
  try {
    const userId: string =
      req.user!.id;

    const ahorro =
      await crearAhorro(
        userId,
        req.body
      );

    return res.status(201).json({
      message:
        "Meta de ahorro guardada correctamente",
      ahorro,
    });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function obtener(
  req: Request,
  res: Response
) {
  try {
    const userId: string =
      req.user!.id;

    const ahorro =
      await obtenerAhorro(userId);

    /*
     * No tener un ahorro todavía NO es
     * un error.
     *
     * Esto permitirá que Angular decida:
     *
     * null -> mostrar formulario inicial
     * ahorro -> mostrar ahorro existente
     */
    return res.status(200).json({
      ahorro,
    });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function actualizar(
  req: Request,
  res: Response
) {
  try {
    const userId: string =
      req.user!.id;

    const ahorro =
      await actualizarAhorro(
        userId,
        req.body
      );

    return res.status(200).json({
      message:
        "Meta de ahorro actualizada correctamente",
      ahorro,
    });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function eliminar(
  req: Request,
  res: Response
) {
  try {
    const userId: string =
      req.user!.id;

    await eliminarAhorro(userId);

    return res.status(200).json({
      message:
        "Meta de ahorro eliminada correctamente",
    });
  } catch (error) {
    return manejarError(error, res);
  }
}
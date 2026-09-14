import type {
  Request,
  Response
} from "express";

import {
  EstadisticasError,
  obtenerEstadisticas
} from "./estadisticas.service.js";

function manejarError(
  error: unknown,
  res: Response
) {
  if (
    error instanceof EstadisticasError
  ) {
    return res
      .status(error.statusCode)
      .json({
        message: error.message
      });
  }

  console.error(
    "[estadisticas] Error inesperado:",
    error
  );

  return res
    .status(500)
    .json({
      message:
        "Error interno del servidor"
    });
}

function queryToString(
  valor: unknown
): string | undefined {
  if (
    Array.isArray(valor)
  ) {
    return valor.length > 0
      ? String(valor[0])
      : undefined;
  }

  if (
    valor === undefined ||
    valor === null
  ) {
    return undefined;
  }

  return String(valor);
}

export async function obtener(
  req: Request,
  res: Response
) {
  try {
    const userId:
      string = req.user!.id;

    const periodo =
      queryToString(
        req.query.periodo
      ) ?? "semanal";

    const fecha =
      queryToString(
        req.query.fecha
      );

    const resultado =
      await obtenerEstadisticas(
        userId,
        {
          periodo:
            periodo as
              | "diario"
              | "semanal"
              | "mensual"
              | "anual",

          fecha
        }
      );

    return res
      .status(200)
      .json(resultado);

  } catch (error) {
    return manejarError(
      error,
      res
    );
  }
}
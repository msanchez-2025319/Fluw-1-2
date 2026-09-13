import type { Request, Response } from "express";
import { obtenerResumenImpuestos } from "./impuestos.service.js";

export async function obtenerImpuestos(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    const mes = req.query.mes;

    if (!userId) {
      res.status(401).json({
        message: "Usuario no autenticado",
      });
      return;
    }

    if (typeof mes !== "string") {
      res.status(400).json({
        message: "El parámetro mes es obligatorio",
      });
      return;
    }

    const resumen = await obtenerResumenImpuestos(userId, mes);

    res.status(200).json(resumen);
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error al obtener el resumen de impuestos";

    res.status(400).json({
      message: mensaje,
    });
  }
}
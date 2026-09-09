import type { Request, Response } from "express";
import { calcularImpuestos, ImpuestoError } from "./impuestos.service.js";

function manejarError(error: unknown, res: Response) {
  if (error instanceof ImpuestoError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error("[impuestos] Error inesperado:", error);
  return res.status(500).json({ message: "Error interno del servidor" });
}

function queryToString(valor: unknown): string | undefined {
  if (Array.isArray(valor)) return valor.length > 0 ? String(valor[0]) : undefined;
  if (valor === undefined || valor === null) return undefined;
  return String(valor);
}

export async function obtenerResumen(req: Request, res: Response) {
  try {
    // req.user viene del middleware requireAuth (JWT), igual que en Ingresos.
    // Nunca se toma el userId desde el query ni desde el body: así evitamos
    // que un usuario pueda consultar impuestos de otra persona.
    const userId: string = req.user!.id;
    const mes = queryToString(req.query.mes);

    const resumen = await calcularImpuestos(userId, mes);
    return res.status(200).json({ resumen });
  } catch (error) {
    return manejarError(error, res);
  }
}
import type { Request, Response } from "express";
import {
  crearGasto,
  listarGastos,
  obtenerGastoPorId,
  actualizarGasto,
  eliminarGasto,
  GastoError,
} from "./gastos.service.js";

function manejarError(error: unknown, res: Response) {
  if (error instanceof GastoError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error("[gastos] Error inesperado:", error);
  return res.status(500).json({ message: "Error interno del servidor" });
}

function queryToString(valor: unknown): string | undefined {
  if (Array.isArray(valor)) return valor.length > 0 ? String(valor[0]) : undefined;
  if (valor === undefined || valor === null) return undefined;
  return String(valor);
}

function paramToString(valor: unknown): string {
  if (Array.isArray(valor)) return String(valor[0]);
  return String(valor);
}

export async function crear(req: Request, res: Response) {
  try {
    const userId: string = req.user!.id;
    const gasto = await crearGasto(userId, req.body);
    return res.status(201).json({ message: "Gasto guardado correctamente", gasto });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function listar(req: Request, res: Response) {
  try {
    const userId: string = req.user!.id;
    const desde = queryToString(req.query.desde);
    const hasta = queryToString(req.query.hasta);
    const gastos = await listarGastos(userId, { desde, hasta });
    return res.status(200).json({ gastos });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function obtenerPorId(req: Request, res: Response) {
  try {
    const userId: string = req.user!.id;
    const id: string = paramToString(req.params.id);
    const gasto = await obtenerGastoPorId(userId, id);
    return res.status(200).json({ gasto });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function actualizar(req: Request, res: Response) {
  try {
    const userId: string = req.user!.id;
    const id: string = paramToString(req.params.id);
    const gasto = await actualizarGasto(userId, id, req.body);
    return res.status(200).json({ message: "Gasto actualizado correctamente", gasto });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function eliminar(req: Request, res: Response) {
  try {
    const userId: string = req.user!.id;
    const id: string = paramToString(req.params.id);
    await eliminarGasto(userId, id);
    return res.status(200).json({ message: "Gasto eliminado correctamente" });
  } catch (error) {
    return manejarError(error, res);
  }
}
import type { Request, Response } from "express";
import {
  crearIngreso,
  listarIngresos,
  obtenerIngresoPorId,
  actualizarIngreso,
  eliminarIngreso,
  IngresoError,
} from "./ingresos.service.js";

function manejarError(error: unknown, res: Response) {
  if (error instanceof IngresoError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error("[ingresos] Error inesperado:", error);
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
    const ingreso = await crearIngreso(userId, req.body);
    return res.status(201).json({ message: "Ingreso guardado correctamente", ingreso });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function listar(req: Request, res: Response) {
  try {
    const userId: string = req.user!.id;
    const tipo = queryToString(req.query.tipo);
    const desde = queryToString(req.query.desde);
    const hasta = queryToString(req.query.hasta);
    const ingresos = await listarIngresos(userId, { tipo: tipo as any, desde, hasta });
    return res.status(200).json({ ingresos });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function obtenerPorId(req: Request, res: Response) {
  try {
    const userId: string = req.user!.id;
    const id: string = paramToString(req.params.id);
    const ingreso = await obtenerIngresoPorId(userId, id);
    return res.status(200).json({ ingreso });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function actualizar(req: Request, res: Response) {
  try {
    const userId: string = req.user!.id;
    const id: string = paramToString(req.params.id);
    console.log("[ingresos] PUT recibido - id:", id, "body:", req.body);
    const ingreso = await actualizarIngreso(userId, id, req.body);
    return res.status(200).json({ message: "Ingreso actualizado correctamente", ingreso });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function eliminar(req: Request, res: Response) {
  try {
    const userId: string = req.user!.id;
    const id: string = paramToString(req.params.id);
    await eliminarIngreso(userId, id);
    return res.status(200).json({ message: "Ingreso eliminado correctamente" });
  } catch (error) {
    return manejarError(error, res);
  }
}
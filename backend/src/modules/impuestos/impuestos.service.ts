import { prisma } from "../../config/prisma.js";
import { TASA_IMPUESTO_EXTRA, TASA_IMPUESTO_VARIADO } from "./impuestos.config.js";

export class ImpuestoError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export interface ResumenCategoriaImpuesto {
  totalIngresos: number;
  totalImpuesto: number;
}

export interface ResumenImpuestos {
  mes: string; // formato "YYYY-MM", ej. "2026-09"
  ingresosExtra: ResumenCategoriaImpuesto;
  ingresosVariados: ResumenCategoriaImpuesto;
  totalIngresos: number;
  totalImpuestos: number;
}

/**
 * Convierte el parámetro "mes" (YYYY-MM) en un rango de fechas [inicio, fin).
 * Si no se envía "mes", usa el mes actual.
 */
function obtenerRangoMes(mes?: string): { inicio: Date; fin: Date; etiqueta: string } {
  const ahora = new Date();
  let anio = ahora.getFullYear();
  let mesIndice = ahora.getMonth(); // 0 = enero, 11 = diciembre

  if (mes) {
    const partes = mes.split("-");
    if (partes.length !== 2) {
      throw new ImpuestoError('El parámetro "mes" debe tener el formato YYYY-MM');
    }
    const anioParam = Number(partes[0]);
    const mesParam = Number(partes[1]) - 1;

    if (Number.isNaN(anioParam) || Number.isNaN(mesParam) || mesParam < 0 || mesParam > 11) {
      throw new ImpuestoError('El parámetro "mes" no es válido');
    }
    anio = anioParam;
    mesIndice = mesParam;
  }

  const inicio = new Date(anio, mesIndice, 1, 0, 0, 0, 0);
  const fin = new Date(anio, mesIndice + 1, 1, 0, 0, 0, 0); // primer día del mes siguiente (exclusivo)
  const etiqueta = `${anio}-${String(mesIndice + 1).padStart(2, "0")}`;

  return { inicio, fin, etiqueta };
}

/**
 * Calcula el resumen de impuestos de un usuario para un mes específico.
 * Reutiliza los ingresos ya guardados en la tabla "ingresos" — no crea
 * ni duplica ninguna tabla nueva.
 */
export async function calcularImpuestos(userId: string, mes?: string): Promise<ResumenImpuestos> {
  const { inicio, fin, etiqueta } = obtenerRangoMes(mes);

  // Traemos únicamente los ingresos EXTRA y VARIADO del usuario autenticado,
  // dentro del rango de fechas del mes solicitado.
  const ingresos = await prisma.ingreso.findMany({
    where: {
      userId,
      tipo: { in: ["SUELDO_EXTRA", "SUELDO_VARIADO"] },
      fecha: { gte: inicio, lt: fin },
    },
  });

  let totalExtra = 0;
  let totalVariado = 0;

  for (const ingreso of ingresos) {
    const monto = Number(ingreso.monto); // Decimal de Prisma -> number
    if (ingreso.tipo === "SUELDO_EXTRA") {
      totalExtra += monto;
    } else if (ingreso.tipo === "SUELDO_VARIADO") {
      totalVariado += monto;
    }
  }

  const impuestoExtra = totalExtra * TASA_IMPUESTO_EXTRA;
  const impuestoVariado = totalVariado * TASA_IMPUESTO_VARIADO;

  return {
    mes: etiqueta,
    ingresosExtra: { totalIngresos: totalExtra, totalImpuesto: impuestoExtra },
    ingresosVariados: { totalIngresos: totalVariado, totalImpuesto: impuestoVariado },
    totalIngresos: totalExtra + totalVariado,
    totalImpuestos: impuestoExtra + impuestoVariado,
  };
}
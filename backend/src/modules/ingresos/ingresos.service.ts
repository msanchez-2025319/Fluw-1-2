import { prisma } from "../../config/prisma.js";
import type {
  TipoIngreso,
  CategoriaIngreso,
  MetodoPago,
  EstadoIngreso,
  CuentaDestino,
} from "../../generated/prisma/client.js";

export class IngresoError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const TIPOS_VALIDOS = ["SUELDO_FIJO", "SUELDO_EXTRA", "SUELDO_VARIADO"];

export interface IngresoInput {
  tipo: TipoIngreso;
  categoria?: CategoriaIngreso;
  descripcion?: string;
  monto: number | string;
  fecha: string;
  metodoPago: MetodoPago;
  estado?: EstadoIngreso;
  cuentaDestino: CuentaDestino;
}

function validarTipo(tipo: unknown): asserts tipo is TipoIngreso {
  if (!tipo || !TIPOS_VALIDOS.includes(tipo as string)) {
    throw new IngresoError(`El campo "tipo" es obligatorio y debe ser uno de: ${TIPOS_VALIDOS.join(", ")}`);
  }
}

function validarMonto(monto: unknown): number {
  const valor = Number(monto);
  if (monto === undefined || monto === null || monto === "" || Number.isNaN(valor) || valor <= 0) {
    throw new IngresoError('El campo "monto" es obligatorio y debe ser un número mayor a 0');
  }
  return valor;
}

function validarFecha(fecha: unknown): Date {
  if (!fecha) {
    throw new IngresoError('El campo "fecha" es obligatorio');
  }
  const valor = new Date(fecha as string);
  if (Number.isNaN(valor.getTime())) {
    throw new IngresoError('El campo "fecha" no es una fecha válida');
  }
  return valor;
}

function validarCampoRequerido(valor: unknown, campo: string): void {
  if (valor === undefined || valor === null || valor === "") {
    throw new IngresoError(`El campo "${campo}" es obligatorio`);
  }
}

function construirDatosValidados(input: IngresoInput) {
  validarTipo(input.tipo);
  const monto = validarMonto(input.monto);
  const fecha = validarFecha(input.fecha);
  validarCampoRequerido(input.metodoPago, "metodoPago");
  validarCampoRequerido(input.cuentaDestino, "cuentaDestino");

  const base = {
    tipo: input.tipo,
    monto,
    fecha,
    metodoPago: input.metodoPago,
    cuentaDestino: input.cuentaDestino,
  };

  if (input.tipo === "SUELDO_FIJO") {
    return { ...base, categoria: null, descripcion: null, estado: null };
  }

  validarCampoRequerido(input.categoria, "categoria");
  validarCampoRequerido(input.descripcion, "descripcion");
  validarCampoRequerido(input.estado, "estado");

  return {
    ...base,
    categoria: input.categoria,
    descripcion: input.descripcion,
    estado: input.estado,
  };
}

export async function crearIngreso(userId: string, input: IngresoInput) {
  const data = construirDatosValidados(input);
  return prisma.ingreso.create({ data: { ...data, userId } });
}

export interface FiltroIngresos {
  tipo?: TipoIngreso;
  desde?: string;
  hasta?: string;
}

export async function listarIngresos(userId: string, filtro: FiltroIngresos = {}) {
  const where: Record<string, unknown> = { userId };

  if (filtro.tipo) {
    if (!TIPOS_VALIDOS.includes(filtro.tipo)) {
      throw new IngresoError(`El filtro "tipo" debe ser uno de: ${TIPOS_VALIDOS.join(", ")}`);
    }
    where.tipo = filtro.tipo;
  }

  if (filtro.desde || filtro.hasta) {
    const rangoFecha: Record<string, Date> = {};
    if (filtro.desde) rangoFecha.gte = validarFecha(filtro.desde);
    if (filtro.hasta) rangoFecha.lte = validarFecha(filtro.hasta);
    where.fecha = rangoFecha;
  }

  return prisma.ingreso.findMany({ where, orderBy: { fecha: "desc" } });
}

export async function obtenerIngresoPorId(userId: string, id: string) {
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new IngresoError("El ID del ingreso es obligatorio", 400);
  }
  const ingreso = await prisma.ingreso.findFirst({ where: { id, userId } });
  if (!ingreso) {
    throw new IngresoError("Ingreso no encontrado", 404);
  }
  return ingreso;
}

export async function actualizarIngreso(userId: string, id: string, input: IngresoInput) {
  await obtenerIngresoPorId(userId, id);
  const data = construirDatosValidados(input);
  return prisma.ingreso.update({ where: { id }, data });
}

export async function eliminarIngreso(userId: string, id: string) {
  await obtenerIngresoPorId(userId, id);
  await prisma.ingreso.delete({ where: { id } });
}
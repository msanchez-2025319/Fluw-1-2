import { prisma } from "../../config/prisma.js";
import type { FormaPago, EstadoGasto, CategoriaGasto } from "../../generated/prisma/client.js";

export class GastoError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const FORMAS_VALIDAS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "OTRO"];
const ESTADOS_VALIDOS = ["PAGADO", "POR_PAGAR", "DEBIENDO_A_OTRO"];
const CATEGORIAS_VALIDAS = ["EMPRESA", "PERSONAL", "TRABAJO", "OTRO"];

export interface GastoInput {
  fecha: string;
  descripcion: string;
  monto: number | string;
  formaPago: FormaPago;
  estado: EstadoGasto;
  categoria: CategoriaGasto;
}

function validarFormaPago(valor: unknown): asserts valor is FormaPago {
  if (!valor || !FORMAS_VALIDAS.includes(valor as string)) {
    throw new GastoError(`El campo "formaPago" es obligatorio y debe ser uno de: ${FORMAS_VALIDAS.join(", ")}`);
  }
}

function validarEstado(valor: unknown): asserts valor is EstadoGasto {
  if (!valor || !ESTADOS_VALIDOS.includes(valor as string)) {
    throw new GastoError(`El campo "estado" es obligatorio y debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`);
  }
}

function validarCategoria(valor: unknown): asserts valor is CategoriaGasto {
  if (!valor || !CATEGORIAS_VALIDAS.includes(valor as string)) {
    throw new GastoError(`El campo "categoria" es obligatorio y debe ser uno de: ${CATEGORIAS_VALIDAS.join(", ")}`);
  }
}

function validarMonto(monto: unknown): number {
  const valor = Number(monto);
  if (monto === undefined || monto === null || monto === "" || Number.isNaN(valor) || valor <= 0) {
    throw new GastoError('El campo "monto" es obligatorio y debe ser un número mayor a 0');
  }
  return valor;
}

function validarFecha(fecha: unknown): Date {
  if (!fecha) {
    throw new GastoError('El campo "fecha" es obligatorio');
  }
  const valor = new Date(fecha as string);
  if (Number.isNaN(valor.getTime())) {
    throw new GastoError('El campo "fecha" no es una fecha válida');
  }
  return valor;
}

function validarDescripcion(descripcion: unknown): string {
  if (!descripcion || typeof descripcion !== "string" || descripcion.trim() === "") {
    throw new GastoError('El campo "descripcion" es obligatorio y no puede estar vacío');
  }
  return descripcion.trim();
}

function construirDatosValidados(input: GastoInput) {
  const fecha = validarFecha(input.fecha);
  const descripcion = validarDescripcion(input.descripcion);
  const monto = validarMonto(input.monto);
  validarFormaPago(input.formaPago);
  validarEstado(input.estado);
  validarCategoria(input.categoria);

  return {
    fecha,
    descripcion,
    monto,
    formaPago: input.formaPago,
    estado: input.estado,
    categoria: input.categoria,
  };
}

export async function crearGasto(userId: string, input: GastoInput) {
  const data = construirDatosValidados(input);
  return prisma.gasto.create({ data: { ...data, userId } });
}

export interface FiltroGastos {
  desde?: string;
  hasta?: string;
}

export async function listarGastos(userId: string, filtro: FiltroGastos = {}) {
  const where: Record<string, unknown> = { userId };

  if (filtro.desde || filtro.hasta) {
    const rangoFecha: Record<string, Date> = {};
    if (filtro.desde) rangoFecha.gte = validarFecha(filtro.desde);
    if (filtro.hasta) rangoFecha.lte = validarFecha(filtro.hasta);
    where.fecha = rangoFecha;
  }

  return prisma.gasto.findMany({ where, orderBy: { fecha: "desc" } });
}

export async function obtenerGastoPorId(userId: string, id: string) {
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new GastoError("El ID del gasto es obligatorio", 400);
  }
  const gasto = await prisma.gasto.findFirst({ where: { id: parseInt(id), userId } });
  if (!gasto) {
    throw new GastoError("Gasto no encontrado", 404);
  }
  return gasto;
}

export async function actualizarGasto(userId: string, id: string, input: GastoInput) {
  await obtenerGastoPorId(userId, id);
  const data = construirDatosValidados(input);
  return prisma.gasto.update({ where: { id: parseInt(id) }, data });
}

export async function eliminarGasto(userId: string, id: string) {
  await obtenerGastoPorId(userId, id);
  await prisma.gasto.delete({ where: { id: parseInt(id) } });
}
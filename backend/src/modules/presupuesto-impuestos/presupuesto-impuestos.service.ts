import { prisma } from "../../config/prisma.js";

export class PresupuestoImpuestoError extends Error {
  statusCode: number;

  constructor(
    message: string,
    statusCode = 400
  ) {
    super(message);

    this.name = "PresupuestoImpuestoError";
    this.statusCode = statusCode;
  }
}

export interface PresupuestoImpuestoRespuesta {
  id: string;
  monto: number;
  createdAt: Date;
  updatedAt: Date;
}

function validarMonto(
  monto: unknown
): number {

  const montoNumero =
    Number(monto);

  if (
    !Number.isFinite(montoNumero) ||
    montoNumero <= 0
  ) {
    throw new PresupuestoImpuestoError(
      "El monto del presupuesto debe ser mayor a 0"
    );
  }

  return Number(
    montoNumero.toFixed(2)
  );
}

function convertirPresupuesto(
  presupuesto: {
    id: string;
    monto: unknown;
    createdAt: Date;
    updatedAt: Date;
  }
): PresupuestoImpuestoRespuesta {

  return {
    id: presupuesto.id,

    monto:
      Number(presupuesto.monto),

    createdAt:
      presupuesto.createdAt,

    updatedAt:
      presupuesto.updatedAt
  };
}

export async function obtenerPresupuestoImpuesto(
  userId: string
): Promise<PresupuestoImpuestoRespuesta | null> {

  const presupuesto =
    await prisma.presupuestoImpuesto.findUnique({
      where: {
        userId
      }
    });

  if (!presupuesto) {
    return null;
  }

  return convertirPresupuesto(
    presupuesto
  );
}

export async function crearPresupuestoImpuesto(
  userId: string,
  monto: unknown
): Promise<PresupuestoImpuestoRespuesta> {

  const montoValidado =
    validarMonto(monto);

  const presupuestoExistente =
    await prisma.presupuestoImpuesto.findUnique({
      where: {
        userId
      }
    });

  if (presupuestoExistente) {
    throw new PresupuestoImpuestoError(
      "Ya existe un presupuesto de impuestos para este usuario",
      409
    );
  }

  const presupuesto =
    await prisma.presupuestoImpuesto.create({
      data: {
        monto: montoValidado,
        userId
      }
    });

  return convertirPresupuesto(
    presupuesto
  );
}

export async function actualizarPresupuestoImpuesto(
  userId: string,
  monto: unknown
): Promise<PresupuestoImpuestoRespuesta> {

  const montoValidado =
    validarMonto(monto);

  const presupuestoExistente =
    await prisma.presupuestoImpuesto.findUnique({
      where: {
        userId
      }
    });

  if (!presupuestoExistente) {
    throw new PresupuestoImpuestoError(
      "No existe un presupuesto de impuestos",
      404
    );
  }

  const presupuesto =
    await prisma.presupuestoImpuesto.update({
      where: {
        userId
      },

      data: {
        monto: montoValidado
      }
    });

  return convertirPresupuesto(
    presupuesto
  );
}

export async function eliminarPresupuestoImpuesto(
  userId: string
): Promise<void> {

  const presupuestoExistente =
    await prisma.presupuestoImpuesto.findUnique({
      where: {
        userId
      }
    });

  if (!presupuestoExistente) {
    throw new PresupuestoImpuestoError(
      "No existe un presupuesto de impuestos",
      404
    );
  }

  await prisma.presupuestoImpuesto.delete({
    where: {
      userId
    }
  });
}
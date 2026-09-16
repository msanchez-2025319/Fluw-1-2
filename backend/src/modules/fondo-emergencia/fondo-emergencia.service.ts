import { prisma } from "../../config/prisma.js";

export type TipoCuotaFondo =
  | "SEMANAL"
  | "MENSUAL"
  | "ANUAL";

export interface FondoEmergenciaResponse {
  id: string;
  monto: number;
  tipoCuota: TipoCuotaFondo;
  createdAt: Date;
  updatedAt: Date;
}

export interface FondoEmergenciaInput {
  monto: number;
  tipoCuota: TipoCuotaFondo;
}

export class FondoEmergenciaError extends Error {
  statusCode: number;

  constructor(
    message: string,
    statusCode: number
  ) {
    super(message);

    this.name = "FondoEmergenciaError";
    this.statusCode = statusCode;
  }
}

function validarMonto(
  monto: unknown
): number {

  const valor =
    Number(monto);

  if (
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    throw new FondoEmergenciaError(
      "El monto debe ser mayor a Q0.00.",
      400
    );
  }

  return Number(
    valor.toFixed(2)
  );
}

function validarTipoCuota(
  tipoCuota: unknown
): TipoCuotaFondo {

  const tiposValidos:
    TipoCuotaFondo[] = [
      "SEMANAL",
      "MENSUAL",
      "ANUAL"
    ];

  if (
    typeof tipoCuota !== "string" ||
    !tiposValidos.includes(
      tipoCuota as TipoCuotaFondo
    )
  ) {
    throw new FondoEmergenciaError(
      "El tipo de cuota debe ser SEMANAL, MENSUAL o ANUAL.",
      400
    );
  }

  return tipoCuota as TipoCuotaFondo;
}

function convertirFondo(
  fondo: {
    id: string;
    monto: unknown;
    tipoCuota: string;
    createdAt: Date;
    updatedAt: Date;
  }
): FondoEmergenciaResponse {

  return {
    id: fondo.id,

    monto:
      Number(fondo.monto),

    tipoCuota:
      fondo.tipoCuota as TipoCuotaFondo,

    createdAt:
      fondo.createdAt,

    updatedAt:
      fondo.updatedAt
  };
}

export async function obtenerFondoEmergencia(
  userId: string
): Promise<FondoEmergenciaResponse | null> {

  const fondo =
    await prisma.fondoEmergencia.findUnique({
      where: {
        userId
      }
    });

  if (!fondo) {
    return null;
  }

  return convertirFondo(fondo);
}

export async function crearFondoEmergencia(
  userId: string,
  input: FondoEmergenciaInput
): Promise<FondoEmergenciaResponse> {

  const monto =
    validarMonto(input.monto);

  const tipoCuota =
    validarTipoCuota(
      input.tipoCuota
    );

  const existente =
    await prisma.fondoEmergencia.findUnique({
      where: {
        userId
      }
    });

  if (existente) {
    throw new FondoEmergenciaError(
      "Ya existe un fondo de emergencia para este usuario.",
      409
    );
  }

  const fondo =
    await prisma.fondoEmergencia.create({
      data: {
        monto,
        tipoCuota,
        userId
      }
    });

  return convertirFondo(fondo);
}

export async function actualizarFondoEmergencia(
  userId: string,
  input: FondoEmergenciaInput
): Promise<FondoEmergenciaResponse> {

  const monto =
    validarMonto(input.monto);

  const tipoCuota =
    validarTipoCuota(
      input.tipoCuota
    );

  const existente =
    await prisma.fondoEmergencia.findUnique({
      where: {
        userId
      }
    });

  if (!existente) {
    throw new FondoEmergenciaError(
      "No existe un fondo de emergencia para editar.",
      404
    );
  }

  const fondo =
    await prisma.fondoEmergencia.update({
      where: {
        userId
      },

      data: {
        monto,
        tipoCuota
      }
    });

  return convertirFondo(fondo);
}

export async function eliminarFondoEmergencia(
  userId: string
): Promise<void> {

  const existente =
    await prisma.fondoEmergencia.findUnique({
      where: {
        userId
      }
    });

  if (!existente) {
    throw new FondoEmergenciaError(
      "No existe un fondo de emergencia para eliminar.",
      404
    );
  }

  await prisma.fondoEmergencia.delete({
    where: {
      userId
    }
  });
}
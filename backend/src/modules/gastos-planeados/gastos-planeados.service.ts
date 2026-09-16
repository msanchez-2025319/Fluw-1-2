import { prisma } from "../../config/prisma.js";

export type TipoCuotaGastoPlaneado =
  | "SEMANAL"
  | "MENSUAL"
  | "ANUAL";

export interface GastoPlaneadoInput {
  monto: number;
  tipoCuota: TipoCuotaGastoPlaneado;
}

export interface GastoPlaneadoResponse {
  id: string;
  monto: number;
  tipoCuota: TipoCuotaGastoPlaneado;
  totalGastado: number;
  montoDisponible: number;
  porcentaje: number;
  createdAt: Date;
  updatedAt: Date;
}

export class GastoPlaneadoError extends Error {
  statusCode: number;

  constructor(
    message: string,
    statusCode: number
  ) {
    super(message);

    this.name = "GastoPlaneadoError";
    this.statusCode = statusCode;
  }
}

function validarMonto(
  monto: unknown
): number {

  const valor = Number(monto);

  if (
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    throw new GastoPlaneadoError(
      "El monto del presupuesto debe ser mayor a Q0.00.",
      400
    );
  }

  return Number(
    valor.toFixed(2)
  );
}

function validarTipoCuota(
  tipoCuota: unknown
): TipoCuotaGastoPlaneado {

  const tiposValidos:
    TipoCuotaGastoPlaneado[] = [
      "SEMANAL",
      "MENSUAL",
      "ANUAL"
    ];

  if (
    typeof tipoCuota !== "string" ||
    !tiposValidos.includes(
      tipoCuota as TipoCuotaGastoPlaneado
    )
  ) {
    throw new GastoPlaneadoError(
      "El tipo de cuota debe ser SEMANAL, MENSUAL o ANUAL.",
      400
    );
  }

  return tipoCuota as TipoCuotaGastoPlaneado;
}

/*
 * Obtiene el rango de fechas que corresponde
 * al tipo de cuota seleccionado.
 *
 * SEMANAL  -> semana actual
 * MENSUAL  -> mes actual
 * ANUAL    -> año actual
 */
function obtenerRangoFechas(
  tipoCuota: TipoCuotaGastoPlaneado
): {
  inicio: Date;
  fin: Date;
} {

  const ahora =
    new Date();

  let inicio: Date;
  let fin: Date;

  if (tipoCuota === "SEMANAL") {

    const dia =
      ahora.getDay();

    const diferenciaLunes =
      dia === 0
        ? -6
        : 1 - dia;

    inicio =
      new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() +
          diferenciaLunes,
        0,
        0,
        0,
        0
      );

    fin =
      new Date(inicio);

    fin.setDate(
      inicio.getDate() + 7
    );

    return {
      inicio,
      fin
    };
  }

  if (tipoCuota === "ANUAL") {

    inicio =
      new Date(
        ahora.getFullYear(),
        0,
        1,
        0,
        0,
        0,
        0
      );

    fin =
      new Date(
        ahora.getFullYear() + 1,
        0,
        1,
        0,
        0,
        0,
        0
      );

    return {
      inicio,
      fin
    };
  }

  // MENSUAL

  inicio =
    new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

  fin =
    new Date(
      ahora.getFullYear(),
      ahora.getMonth() + 1,
      1,
      0,
      0,
      0,
      0
    );

  return {
    inicio,
    fin
  };
}

async function calcularTotalGastado(
  userId: string,
  tipoCuota: TipoCuotaGastoPlaneado
): Promise<number> {

  const {
    inicio,
    fin
  } =
    obtenerRangoFechas(
      tipoCuota
    );

  const resultado =
    await prisma.gasto.aggregate({
      where: {
        userId,

        fecha: {
          gte: inicio,
          lt: fin
        }
      },

      _sum: {
        monto: true
      }
    });

  return Number(
    resultado._sum.monto ?? 0
  );
}

async function construirRespuesta(
  fondo: {
    id: string;
    monto: unknown;
    tipoCuota: string;
    createdAt: Date;
    updatedAt: Date;
  },
  userId: string
): Promise<GastoPlaneadoResponse> {

  const monto =
    Number(fondo.monto);

  const tipoCuota =
    fondo.tipoCuota as TipoCuotaGastoPlaneado;

  const totalGastado =
    await calcularTotalGastado(
      userId,
      tipoCuota
    );

  const porcentajeReal =
    monto > 0
      ? (
          totalGastado /
          monto
        ) * 100
      : 0;

  /*
   * El porcentaje visual nunca supera 100.
   * Si gasta más del presupuesto,
   * la barra permanece completamente roja.
   */
  const porcentaje =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          porcentajeReal.toFixed(2)
        )
      )
    );

  const montoDisponible =
    Math.max(
      0,
      Number(
        (
          monto -
          totalGastado
        ).toFixed(2)
      )
    );

  return {
    id: fondo.id,
    monto,
    tipoCuota,
    totalGastado:
      Number(
        totalGastado.toFixed(2)
      ),
    montoDisponible,
    porcentaje,
    createdAt:
      fondo.createdAt,
    updatedAt:
      fondo.updatedAt
  };
}

export async function obtenerGastoPlaneado(
  userId: string
): Promise<GastoPlaneadoResponse | null> {

  const gastoPlaneado =
    await prisma.gastoPlaneado
      .findUnique({
        where: {
          userId
        }
      });

  if (!gastoPlaneado) {
    return null;
  }

  return construirRespuesta(
    gastoPlaneado,
    userId
  );
}

export async function crearGastoPlaneado(
  userId: string,
  input: GastoPlaneadoInput
): Promise<GastoPlaneadoResponse> {

  const monto =
    validarMonto(
      input.monto
    );

  const tipoCuota =
    validarTipoCuota(
      input.tipoCuota
    );

  const existente =
    await prisma.gastoPlaneado
      .findUnique({
        where: {
          userId
        }
      });

  if (existente) {
    throw new GastoPlaneadoError(
      "Ya existe un gasto planeado para este usuario.",
      409
    );
  }

  const gastoPlaneado =
    await prisma.gastoPlaneado
      .create({
        data: {
          monto,
          tipoCuota,
          userId
        }
      });

  return construirRespuesta(
    gastoPlaneado,
    userId
  );
}

export async function actualizarGastoPlaneado(
  userId: string,
  input: GastoPlaneadoInput
): Promise<GastoPlaneadoResponse> {

  const monto =
    validarMonto(
      input.monto
    );

  const tipoCuota =
    validarTipoCuota(
      input.tipoCuota
    );

  const existente =
    await prisma.gastoPlaneado
      .findUnique({
        where: {
          userId
        }
      });

  if (!existente) {
    throw new GastoPlaneadoError(
      "No existe un gasto planeado para editar.",
      404
    );
  }

  const gastoPlaneado =
    await prisma.gastoPlaneado
      .update({
        where: {
          userId
        },

        data: {
          monto,
          tipoCuota
        }
      });

  return construirRespuesta(
    gastoPlaneado,
    userId
  );
}

export async function eliminarGastoPlaneado(
  userId: string
): Promise<void> {

  const existente =
    await prisma.gastoPlaneado
      .findUnique({
        where: {
          userId
        }
      });

  if (!existente) {
    throw new GastoPlaneadoError(
      "No existe un gasto planeado para eliminar.",
      404
    );
  }

  await prisma.gastoPlaneado
    .delete({
      where: {
        userId
      }
    });
}
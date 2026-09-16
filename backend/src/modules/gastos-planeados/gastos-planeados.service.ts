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

/* =========================
   VALIDAR MONTO
========================= */

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

/* =========================
   VALIDAR TIPO CUOTA
========================= */

function validarTipoCuota(
  tipoCuota: unknown
): TipoCuotaGastoPlaneado {
  const tiposValidos: TipoCuotaGastoPlaneado[] = [
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

/* =========================
   RANGO DE FECHAS
========================= */

function obtenerRangoFechas(
  tipoCuota: TipoCuotaGastoPlaneado
): {
  inicio: Date;
  fin: Date;
} {
  const ahora = new Date();

  let inicio: Date;
  let fin: Date;

  /* =========================
     SEMANAL
  ========================= */

  if (tipoCuota === "SEMANAL") {
    const dia = ahora.getDay();

    const diferenciaLunes =
      dia === 0
        ? -6
        : 1 - dia;

    inicio = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate() + diferenciaLunes,
      0,
      0,
      0,
      0
    );

    fin = new Date(inicio);

    fin.setDate(
      inicio.getDate() + 7
    );

    return {
      inicio,
      fin
    };
  }

  /* =========================
     ANUAL
  ========================= */

  if (tipoCuota === "ANUAL") {
    inicio = new Date(
      ahora.getFullYear(),
      0,
      1,
      0,
      0,
      0,
      0
    );

    fin = new Date(
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

  /* =========================
     MENSUAL
  ========================= */

  inicio = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    1,
    0,
    0,
    0,
    0
  );

  fin = new Date(
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

/* =========================
   TOTAL GASTADO
========================= */

async function calcularTotalGastado(
  userId: string,
  tipoCuota: TipoCuotaGastoPlaneado
): Promise<number> {
  const {
    inicio,
    fin
  } = obtenerRangoFechas(
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

/* =========================
   FORMATEAR MONTO
========================= */

function formatearMonto(
  monto: number
): string {
  return monto.toLocaleString(
    "es-GT",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}

/* =========================
   CLAVE DEL PERÍODO
========================= */

function obtenerClavePeriodo(
  tipoCuota: TipoCuotaGastoPlaneado
): string {
  const {
    inicio
  } = obtenerRangoFechas(
    tipoCuota
  );

  const anio =
    inicio.getFullYear();

  const mes =
    String(
      inicio.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      inicio.getDate()
    ).padStart(
      2,
      "0"
    );

  if (
    tipoCuota === "ANUAL"
  ) {
    return `${anio}`;
  }

  if (
    tipoCuota === "MENSUAL"
  ) {
    return `${anio}-${mes}`;
  }

  return `${anio}-${mes}-${dia}`;
}

/* =========================
   NOTIFICACIÓN
   LÍMITE DE GASTOS
========================= */

async function verificarLimiteGastos(
  userId: string,
  gastoPlaneadoId: string,
  monto: number,
  totalGastado: number,
  tipoCuota: TipoCuotaGastoPlaneado
): Promise<void> {
  /*
   * Si todavía no llegó al límite,
   * no generamos ninguna notificación.
   */
  if (
    totalGastado < monto
  ) {
    return;
  }

  const periodo =
    obtenerClavePeriodo(
      tipoCuota
    );

  /*
   * Ejemplos:
   *
   * SEMANAL:
   * [GASTO_PLANEADO:ID:SEMANAL:2026-09-14]
   *
   * MENSUAL:
   * [GASTO_PLANEADO:ID:MENSUAL:2026-09]
   *
   * ANUAL:
   * [GASTO_PLANEADO:ID:ANUAL:2026]
   */
  const referencia =
    `[GASTO_PLANEADO:${gastoPlaneadoId}:${tipoCuota}:${periodo}]`;

  /*
   * Comprobamos si ya existe
   * una notificación para este
   * período.
   */
  const existente =
    await prisma.notificacion.findFirst({
      where: {
        userId,

        tipo:
          "LIMITE_GASTOS",

        mensaje: {
          contains:
            referencia
        }
      }
    });

  /*
   * Ya fue notificado.
   */
  if (existente) {
    return;
  }

  const exceso =
    Number(
      Math.max(
        0,
        totalGastado - monto
      ).toFixed(2)
    );

  let mensaje =
    `Has alcanzado tu límite de gastos planeados de Q${formatearMonto(monto)}.`;

  /*
   * Si realmente lo superó,
   * indicamos cuánto se excedió.
   */
  if (exceso > 0) {
    mensaje =
      `Has superado tu límite de gastos planeados de Q${formatearMonto(monto)}. Te has excedido por Q${formatearMonto(exceso)}.`;
  }

  await prisma.notificacion.create({
    data: {
      tipo:
        "LIMITE_GASTOS",

      titulo:
        "Límite de gastos",

      mensaje:
        `${mensaje} ${referencia}`,

      userId
    }
  });
}

/* =========================
   CONSTRUIR RESPUESTA
========================= */

async function construirRespuesta(
  gastoPlaneado: {
    id: string;
    monto: unknown;
    tipoCuota: string;
    createdAt: Date;
    updatedAt: Date;
  },
  userId: string
): Promise<GastoPlaneadoResponse> {
  const monto =
    Number(
      gastoPlaneado.monto
    );

  /*
   * CORREGIDO:
   * El "as" debe formar parte
   * de la misma expresión.
   */
  const tipoCuota =
    gastoPlaneado.tipoCuota as TipoCuotaGastoPlaneado;

  const totalGastado =
    await calcularTotalGastado(
      userId,
      tipoCuota
    );

  /*
   * Comprobamos si alcanzó
   * o superó el presupuesto.
   */
  try {
    await verificarLimiteGastos(
      userId,
      gastoPlaneado.id,
      monto,
      totalGastado,
      tipoCuota
    );
  } catch (error) {
    /*
     * Si falla la creación de
     * la notificación, no impedimos
     * cargar Gasto Planeado.
     */
    console.error(
      "[gastos-planeados] Error al generar notificación:",
      error
    );
  }

  const porcentajeReal =
    monto > 0
      ? (
          totalGastado /
          monto
        ) * 100
      : 0;

  /*
   * Visualmente la barra
   * nunca supera el 100%.
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

  /*
   * El disponible tampoco
   * puede mostrarse negativo.
   */
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
    id:
      gastoPlaneado.id,

    monto,

    tipoCuota,

    totalGastado:
      Number(
        totalGastado.toFixed(2)
      ),

    montoDisponible,

    porcentaje,

    createdAt:
      gastoPlaneado.createdAt,

    updatedAt:
      gastoPlaneado.updatedAt
  };
}

/* =========================
   OBTENER GASTO PLANEADO
========================= */

export async function obtenerGastoPlaneado(
  userId: string
): Promise<GastoPlaneadoResponse | null> {
  const gastoPlaneado =
    await prisma.gastoPlaneado.findUnique({
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

/* =========================
   CREAR GASTO PLANEADO
========================= */

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
    await prisma.gastoPlaneado.findUnique({
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
    await prisma.gastoPlaneado.create({
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

/* =========================
   ACTUALIZAR GASTO PLANEADO
========================= */

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
    await prisma.gastoPlaneado.findUnique({
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
    await prisma.gastoPlaneado.update({
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

/* =========================
   ELIMINAR GASTO PLANEADO
========================= */

export async function eliminarGastoPlaneado(
  userId: string
): Promise<void> {
  const existente =
    await prisma.gastoPlaneado.findUnique({
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

  /*
   * Eliminamos las notificaciones
   * asociadas a este presupuesto.
   */
  await prisma.notificacion.deleteMany({
    where: {
      userId,

      tipo:
        "LIMITE_GASTOS",

      mensaje: {
        contains:
          `[GASTO_PLANEADO:${existente.id}:`
      }
    }
  });

  /*
   * Eliminamos el gasto planeado.
   */
  await prisma.gastoPlaneado.delete({
    where: {
      userId
    }
  });
}
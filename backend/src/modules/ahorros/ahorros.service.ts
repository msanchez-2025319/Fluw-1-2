import { prisma } from "../../config/prisma.js";
import type { TipoCuota } from "../../generated/prisma/client.js";

export class AhorroError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const TIPOS_CUOTA_VALIDOS = [
  "SEMANAL",
  "MENSUAL",
  "ANUAL",
];

export interface AhorroInput {
  metaAhorro: number | string;
  tipoCuota: TipoCuota;
  montoCuota: number | string;
}

/* =========================
   VALIDACIONES
========================= */

function validarMonto(
  valor: unknown,
  campo: string
): number {
  if (
    valor === undefined ||
    valor === null ||
    valor === "" ||
    Number.isNaN(Number(valor))
  ) {
    throw new AhorroError(
      `El campo "${campo}" es obligatorio y debe ser un número válido`
    );
  }

  const numero = Number(valor);

  if (numero <= 0) {
    throw new AhorroError(
      `El campo "${campo}" debe ser mayor a 0`
    );
  }

  return numero;
}

function validarTipoCuota(
  tipoCuota: unknown
): TipoCuota {
  if (
    !tipoCuota ||
    !TIPOS_CUOTA_VALIDOS.includes(
      String(tipoCuota)
    )
  ) {
    throw new AhorroError(
      `El campo "tipoCuota" es obligatorio y debe ser uno de: ${TIPOS_CUOTA_VALIDOS.join(", ")}`
    );
  }

  return tipoCuota as TipoCuota;
}

function construirDatosValidados(
  input: AhorroInput
) {
  if (!input || typeof input !== "object") {
    throw new AhorroError(
      "Los datos del ahorro son obligatorios"
    );
  }

  const metaAhorro = validarMonto(
    input.metaAhorro,
    "metaAhorro"
  );

  const montoCuota = validarMonto(
    input.montoCuota,
    "montoCuota"
  );

  const tipoCuota = validarTipoCuota(
    input.tipoCuota
  );

  if (montoCuota > metaAhorro) {
    throw new AhorroError(
      "El monto de la cuota no puede ser mayor que la meta de ahorro"
    );
  }

  return {
    metaAhorro,
    tipoCuota,
    montoCuota,
  };
}

/* =========================
   PORCENTAJE
========================= */

function calcularPorcentaje(
  ahorroActual: number,
  metaAhorro: number
): number {
  if (metaAhorro <= 0) {
    return 0;
  }

  const porcentaje =
    (ahorroActual / metaAhorro) * 100;

  return Math.min(
    100,
    Math.max(0, porcentaje)
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
      maximumFractionDigits: 2,
    }
  );
}

/* =========================
   FORMATEAR RESPUESTA
========================= */

function formatearRespuesta(
  ahorro: any
) {
  const metaAhorro =
    Number(ahorro.metaAhorro);

  const montoCuota =
    Number(ahorro.montoCuota);

  const ahorroActual =
    Number(ahorro.ahorroActual);

  const porcentaje =
    calcularPorcentaje(
      ahorroActual,
      metaAhorro
    );

  return {
    id: ahorro.id,

    metaAhorro,

    tipoCuota:
      ahorro.tipoCuota,

    montoCuota,

    ahorroActual,

    porcentaje: Number(
      porcentaje.toFixed(2)
    ),

    createdAt:
      ahorro.createdAt,

    updatedAt:
      ahorro.updatedAt,
  };
}

/* =========================
   NOTIFICACIÓN META AHORRO
========================= */

async function verificarMetaAhorro(
  userId: string,
  ahorro: {
    id: string;
    metaAhorro: any;
    ahorroActual: any;
  }
) {
  const metaAhorro =
    Number(ahorro.metaAhorro);

  const ahorroActual =
    Number(ahorro.ahorroActual);

  /*
   * Todavía no llegó a la meta.
   */
  if (
    ahorroActual < metaAhorro
  ) {
    return;
  }

  /*
   * Esta referencia permite distinguir
   * una meta de otra.
   *
   * Si el usuario cambia de Q5,000
   * a Q10,000, la nueva meta podrá
   * generar otra notificación.
   */
  const referencia =
    `[AHORRO:${ahorro.id}:META:${metaAhorro.toFixed(2)}]`;

  const existente =
    await prisma.notificacion.findFirst({
      where: {
        userId,
        tipo: "META_AHORRO",

        mensaje: {
          contains: referencia,
        },
      },
    });

  /*
   * Ya notificamos esta meta.
   */
  if (existente) {
    return;
  }

  await prisma.notificacion.create({
    data: {
      tipo: "META_AHORRO",

      titulo:
        "Meta de ahorro alcanzada",

      mensaje:
        `¡Felicidades! Alcanzaste tu meta de ahorro de Q${formatearMonto(metaAhorro)}. ${referencia}`,

      userId,
    },
  });
}

/* =========================
   CREAR AHORRO
========================= */

export async function crearAhorro(
  userId: string,
  input: AhorroInput
) {
  if (!userId) {
    throw new AhorroError(
      "Usuario no autenticado",
      401
    );
  }

  const existente =
    await prisma.ahorro.findUnique({
      where: {
        userId,
      },
    });

  if (existente) {
    throw new AhorroError(
      "El usuario ya tiene una meta de ahorro registrada",
      409
    );
  }

  const data =
    construirDatosValidados(
      input
    );

  const ahorro =
    await prisma.ahorro.create({
      data: {
        ...data,
        ahorroActual: 0,
        userId,
      },
    });

  return formatearRespuesta(
    ahorro
  );
}

/* =========================
   OBTENER AHORRO
========================= */

export async function obtenerAhorro(
  userId: string
) {
  if (!userId) {
    throw new AhorroError(
      "Usuario no autenticado",
      401
    );
  }

  const ahorro =
    await prisma.ahorro.findUnique({
      where: {
        userId,
      },
    });

  if (!ahorro) {
    return null;
  }

  /*
   * Cada vez que consultamos el ahorro
   * comprobamos si ya alcanzó su meta.
   */
  try {
    await verificarMetaAhorro(
      userId,
      ahorro
    );
  } catch (error) {
    /*
     * Una falla en notificaciones
     * no debe impedir cargar el ahorro.
     */
    console.error(
      "[ahorros] Error al verificar meta:",
      error
    );
  }

  return formatearRespuesta(
    ahorro
  );
}

/* =========================
   ACTUALIZAR AHORRO
========================= */

export async function actualizarAhorro(
  userId: string,
  input: AhorroInput
) {
  if (!userId) {
    throw new AhorroError(
      "Usuario no autenticado",
      401
    );
  }

  const ahorroExistente =
    await prisma.ahorro.findUnique({
      where: {
        userId,
      },
    });

  if (!ahorroExistente) {
    throw new AhorroError(
      "No existe una meta de ahorro registrada",
      404
    );
  }

  const data =
    construirDatosValidados(
      input
    );

  const ahorro =
    await prisma.ahorro.update({
      where: {
        userId,
      },

      data,
    });

  /*
   * La meta pudo cambiar.
   * Volvemos a comprobarla.
   */
  try {
    await verificarMetaAhorro(
      userId,
      ahorro
    );
  } catch (error) {
    console.error(
      "[ahorros] Error al verificar meta:",
      error
    );
  }

  return formatearRespuesta(
    ahorro
  );
}

/* =========================
   ELIMINAR AHORRO
========================= */

export async function eliminarAhorro(
  userId: string
) {
  if (!userId) {
    throw new AhorroError(
      "Usuario no autenticado",
      401
    );
  }

  const ahorroExistente =
    await prisma.ahorro.findUnique({
      where: {
        userId,
      },
    });

  if (!ahorroExistente) {
    throw new AhorroError(
      "No existe una meta de ahorro registrada",
      404
    );
  }

  /*
   * Eliminamos las notificaciones
   * relacionadas con esta meta.
   */
  await prisma.notificacion.deleteMany({
    where: {
      userId,
      tipo: "META_AHORRO",

      mensaje: {
        contains:
          `[AHORRO:${ahorroExistente.id}:`,
      },
    },
  });

  await prisma.ahorro.delete({
    where: {
      userId,
    },
  });
}
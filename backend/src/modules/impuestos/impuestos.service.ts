import { prisma } from "../../config/prisma.js";

export interface ResumenImpuestos {
  mes: string;

  ingresosExtra: {
    total: number;
    impuesto: number;
  };

  ingresosVariables: {
    total: number;
    impuesto: number;
  };

  totalImpuestos: number;
}

/* =========================
   RANGO DEL MES
========================= */

function obtenerRangoMes(
  mes: string
) {
  const formatoMes =
    /^\d{4}-\d{2}$/;

  if (!formatoMes.test(mes)) {
    throw new Error(
      "El mes debe tener el formato YYYY-MM"
    );
  }

  const [
    anioTexto,
    mesTexto
  ] = mes.split("-");

  const anio =
    Number(anioTexto);

  const numeroMes =
    Number(mesTexto);

  if (
    numeroMes < 1 ||
    numeroMes > 12
  ) {
    throw new Error(
      "El mes proporcionado no es válido"
    );
  }

  const fechaInicio =
    new Date(
      Date.UTC(
        anio,
        numeroMes - 1,
        1
      )
    );

  const fechaFin =
    new Date(
      Date.UTC(
        anio,
        numeroMes,
        1
      )
    );

  return {
    fechaInicio,
    fechaFin
  };
}

/* =========================
   CALCULAR IVA
========================= */

function calcularIvaIncluido(
  total: number
): number {
  const iva =
    total * 12 / 112;

  return Number(
    iva.toFixed(2)
  );
}

/* =========================
   FORMATEAR DINERO
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
   NOMBRE DEL MES
========================= */

function obtenerNombreMes(
  mes: string
): string {
  const [
    anioTexto,
    mesTexto
  ] = mes.split("-");

  const nombresMeses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre"
  ];

  const numeroMes =
    Number(mesTexto);

  const nombre =
    nombresMeses[
      numeroMes - 1
    ];

  return `${nombre} de ${anioTexto}`;
}

/* =========================
   NOTIFICACIÓN IMPUESTOS
========================= */

async function verificarNotificacionImpuestos(
  userId: string,
  mes: string,
  totalImpuestos: number
) {
  /*
   * Si no hay impuestos por pagar,
   * no generamos notificación.
   */
  if (totalImpuestos <= 0) {
    return;
  }

  /*
   * Esta referencia identifica
   * la notificación del mes.
   *
   * Ejemplo:
   * [IMPUESTOS:2026-09]
   */
  const referencia =
    `[IMPUESTOS:${mes}]`;

  const existente =
    await prisma.notificacion.findFirst({
      where: {
        userId,

        tipo: "IMPUESTOS",

        mensaje: {
          contains: referencia
        }
      }
    });

  /*
   * Ya existe la notificación
   * correspondiente a ese mes.
   */
  if (existente) {
    return;
  }

  const periodo =
    obtenerNombreMes(mes);

  await prisma.notificacion.create({
    data: {
      tipo: "IMPUESTOS",

      titulo:
        "Impuestos por pagar",

      mensaje:
        `Tienes Q${formatearMonto(totalImpuestos)} de impuestos correspondientes a ${periodo}. ${referencia}`,

      userId
    }
  });
}

/* =========================
   RESUMEN DE IMPUESTOS
========================= */

export async function obtenerResumenImpuestos(
  userId: string,
  mes: string
): Promise<ResumenImpuestos> {

  const {
    fechaInicio,
    fechaFin
  } = obtenerRangoMes(mes);

  const ingresos =
    await prisma.ingreso.findMany({
      where: {
        userId,

        fecha: {
          gte: fechaInicio,
          lt: fechaFin
        }
      },

      select: {
        tipo: true,
        monto: true,
        fecha: true
      }
    });

  console.log(
    "INGRESOS PARA IMPUESTOS:",
    ingresos
  );

  let totalIngresosExtra = 0;
  let totalIngresosVariables = 0;

  for (const ingreso of ingresos) {

    const monto =
      Number(ingreso.monto);

    if (
      ingreso.tipo ===
      "SUELDO_EXTRA"
    ) {
      totalIngresosExtra +=
        monto;
    }

    if (
      ingreso.tipo ===
      "SUELDO_VARIADO"
    ) {
      totalIngresosVariables +=
        monto;
    }
  }

  const impuestoIngresosExtra =
    calcularIvaIncluido(
      totalIngresosExtra
    );

  const impuestoIngresosVariables =
    calcularIvaIncluido(
      totalIngresosVariables
    );

  const totalImpuestos =
    Number(
      (
        impuestoIngresosExtra +
        impuestoIngresosVariables
      ).toFixed(2)
    );

  /* =========================
     CREAR NOTIFICACIÓN
  ========================= */

  try {
    await verificarNotificacionImpuestos(
      userId,
      mes,
      totalImpuestos
    );
  } catch (error) {
    /*
     * Si falla la notificación,
     * el cálculo de impuestos
     * debe seguir funcionando.
     */
    console.error(
      "[impuestos] Error al generar notificación:",
      error
    );
  }

  return {
    mes,

    ingresosExtra: {
      total:
        totalIngresosExtra,

      impuesto:
        impuestoIngresosExtra
    },

    ingresosVariables: {
      total:
        totalIngresosVariables,

      impuesto:
        impuestoIngresosVariables
    },

    totalImpuestos
  };
}
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

function obtenerRangoMes(mes: string) {
  const formatoMes = /^\d{4}-\d{2}$/;

  if (!formatoMes.test(mes)) {
    throw new Error(
      "El mes debe tener el formato YYYY-MM"
    );
  }

  const [anioTexto, mesTexto] =
    mes.split("-");

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

function calcularIvaIncluido(
  total: number
): number {
  const iva =
    total * 12 / 112;

  return Number(
    iva.toFixed(2)
  );
}

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
      totalIngresosExtra += monto;
    }

    if (
      ingreso.tipo ===
      "SUELDO_VARIADO"
    ) {
      totalIngresosVariables += monto;
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
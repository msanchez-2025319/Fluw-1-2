import { prisma } from "../../config/prisma.js";

export type PeriodoEstadistica =
  | "diario"
  | "semanal"
  | "mensual"
  | "anual";

export interface FiltroEstadisticas {
  periodo: PeriodoEstadistica;
  fecha?: string;
}

interface RangoFechas {
  desde: Date;
  hasta: Date;
}

interface PuntoGrafica {
  etiqueta: string;
  ingresos: number;
  gastos: number;
}

export interface ResultadoEstadisticas {
  periodo: PeriodoEstadistica;
  desde: string;
  hasta: string;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  datos: PuntoGrafica[];
}

export class EstadisticasError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const PERIODOS_VALIDOS: PeriodoEstadistica[] = [
  "diario",
  "semanal",
  "mensual",
  "anual"
];

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo"
];

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

function validarPeriodo(
  periodo: string
): asserts periodo is PeriodoEstadistica {
  if (!PERIODOS_VALIDOS.includes(periodo as PeriodoEstadistica)) {
    throw new EstadisticasError(
      `El período debe ser uno de: ${PERIODOS_VALIDOS.join(", ")}`
    );
  }
}

function crearFechaUTC(
  anio: number,
  mes: number,
  dia: number
): Date {
  return new Date(
    Date.UTC(
      anio,
      mes,
      dia,
      0,
      0,
      0,
      0
    )
  );
}

function obtenerFechaActualGuatemala(): Date {
  const ahora = new Date();

  const partes = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "America/Guatemala",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).formatToParts(ahora);

  const anio = Number(
    partes.find(
      parte => parte.type === "year"
    )?.value
  );

  const mes = Number(
    partes.find(
      parte => parte.type === "month"
    )?.value
  );

  const dia = Number(
    partes.find(
      parte => parte.type === "day"
    )?.value
  );

  if (
    Number.isNaN(anio) ||
    Number.isNaN(mes) ||
    Number.isNaN(dia)
  ) {
    throw new EstadisticasError(
      "No se pudo determinar la fecha actual"
    );
  }

  console.log(
    "[estadisticas] fecha Guatemala:",
    {
      anio,
      mes,
      dia
    }
  );

  return crearFechaUTC(
    anio,
    mes - 1,
    dia
  );
}

function obtenerFechaBase(
  fecha?: string
): Date {
  if (!fecha) {
    return obtenerFechaActualGuatemala();
  }

  const formato =
    /^\d{4}-\d{2}-\d{2}$/;

  if (!formato.test(fecha)) {
    throw new EstadisticasError(
      'La fecha debe tener el formato "YYYY-MM-DD"'
    );
  }

  const [
    anioTexto,
    mesTexto,
    diaTexto
  ] = fecha.split("-");

  const anio =
    Number(anioTexto);

  const mes =
    Number(mesTexto);

  const dia =
    Number(diaTexto);

  const resultado =
    crearFechaUTC(
      anio,
      mes - 1,
      dia
    );

  if (
    resultado.getUTCFullYear() !== anio ||
    resultado.getUTCMonth() !== mes - 1 ||
    resultado.getUTCDate() !== dia
  ) {
    throw new EstadisticasError(
      "La fecha proporcionada no es válida"
    );
  }

  return resultado;
}

function obtenerRangoDiario(
  fecha: Date
): RangoFechas {
  const desde =
    crearFechaUTC(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth(),
      fecha.getUTCDate()
    );

  const hasta =
    crearFechaUTC(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth(),
      fecha.getUTCDate() + 1
    );

  return {
    desde,
    hasta
  };
}

function obtenerRangoSemanal(
  fecha: Date
): RangoFechas {
  const diaSemana =
    fecha.getUTCDay();

  const diferenciaLunes =
    diaSemana === 0
      ? -6
      : 1 - diaSemana;

  const desde =
    crearFechaUTC(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth(),
      fecha.getUTCDate() + diferenciaLunes
    );

  const hasta =
    crearFechaUTC(
      desde.getUTCFullYear(),
      desde.getUTCMonth(),
      desde.getUTCDate() + 7
    );

  return {
    desde,
    hasta
  };
}

function obtenerRangoMensual(
  fecha: Date
): RangoFechas {
  const desde =
    crearFechaUTC(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth(),
      1
    );

  const hasta =
    crearFechaUTC(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth() + 1,
      1
    );

  return {
    desde,
    hasta
  };
}

function obtenerRangoAnual(
  fecha: Date
): RangoFechas {
  const desde =
    crearFechaUTC(
      fecha.getUTCFullYear(),
      0,
      1
    );

  const hasta =
    crearFechaUTC(
      fecha.getUTCFullYear() + 1,
      0,
      1
    );

  return {
    desde,
    hasta
  };
}

function obtenerRango(
  periodo: PeriodoEstadistica,
  fecha: Date
): RangoFechas {
  switch (periodo) {
    case "diario":
      return obtenerRangoDiario(fecha);

    case "semanal":
      return obtenerRangoSemanal(fecha);

    case "mensual":
      return obtenerRangoMensual(fecha);

    case "anual":
      return obtenerRangoAnual(fecha);

    default:
      throw new EstadisticasError(
        "Período no válido"
      );
  }
}

function convertirMonto(
  monto: unknown
): number {
  return Number(monto);
}

function crearDatosDiarios(
  totalIngresos: number,
  totalGastos: number
): PuntoGrafica[] {
  return [
    {
      etiqueta: "Hoy",
      ingresos: totalIngresos,
      gastos: totalGastos
    }
  ];
}

function crearDatosSemanales(
  desde: Date,
  ingresos: Array<{
    fecha: Date;
    monto: unknown;
  }>,
  gastos: Array<{
    fecha: Date;
    monto: unknown;
  }>
): PuntoGrafica[] {
  const datos =
    DIAS_SEMANA.map(
      etiqueta => ({
        etiqueta,
        ingresos: 0,
        gastos: 0
      })
    );

  for (const ingreso of ingresos) {
    const diferencia =
      Math.floor(
        (
          ingreso.fecha.getTime() -
          desde.getTime()
        ) /
        86400000
      );

    if (
      diferencia >= 0 &&
      diferencia < 7
    ) {
      datos[diferencia].ingresos +=
        convertirMonto(
          ingreso.monto
        );
    }
  }

  for (const gasto of gastos) {
    const diferencia =
      Math.floor(
        (
          gasto.fecha.getTime() -
          desde.getTime()
        ) /
        86400000
      );

    if (
      diferencia >= 0 &&
      diferencia < 7
    ) {
      datos[diferencia].gastos +=
        convertirMonto(
          gasto.monto
        );
    }
  }

  return datos;
}

function crearDatosMensuales(
  fechaBase: Date,
  ingresos: Array<{
    fecha: Date;
    monto: unknown;
  }>,
  gastos: Array<{
    fecha: Date;
    monto: unknown;
  }>
): PuntoGrafica[] {
  const anio =
    fechaBase.getUTCFullYear();

  const mes =
    fechaBase.getUTCMonth();

  const totalDias =
    new Date(
      Date.UTC(
        anio,
        mes + 1,
        0
      )
    ).getUTCDate();

  const datos:
    PuntoGrafica[] = [];

  for (
    let dia = 1;
    dia <= totalDias;
    dia++
  ) {
    datos.push({
      etiqueta: String(dia),
      ingresos: 0,
      gastos: 0
    });
  }

  for (const ingreso of ingresos) {
    const dia =
      ingreso.fecha.getUTCDate();

    const indice =
      dia - 1;

    if (datos[indice]) {
      datos[indice].ingresos +=
        convertirMonto(
          ingreso.monto
        );
    }
  }

  for (const gasto of gastos) {
    const dia =
      gasto.fecha.getUTCDate();

    const indice =
      dia - 1;

    if (datos[indice]) {
      datos[indice].gastos +=
        convertirMonto(
          gasto.monto
        );
    }
  }

  return datos;
}

function crearDatosAnuales(
  ingresos: Array<{
    fecha: Date;
    monto: unknown;
  }>,
  gastos: Array<{
    fecha: Date;
    monto: unknown;
  }>
): PuntoGrafica[] {
  const datos =
    MESES.map(
      etiqueta => ({
        etiqueta,
        ingresos: 0,
        gastos: 0
      })
    );

  for (const ingreso of ingresos) {
    const mes =
      ingreso.fecha.getUTCMonth();

    datos[mes].ingresos +=
      convertirMonto(
        ingreso.monto
      );
  }

  for (const gasto of gastos) {
    const mes =
      gasto.fecha.getUTCMonth();

    datos[mes].gastos +=
      convertirMonto(
        gasto.monto
      );
  }

  return datos;
}

export async function obtenerEstadisticas(
  userId: string,
  filtro: FiltroEstadisticas
): Promise<ResultadoEstadisticas> {
  validarPeriodo(
    filtro.periodo
  );

  const fechaBase =
    obtenerFechaBase(
      filtro.fecha
    );

  const {
    desde,
    hasta
  } = obtenerRango(
    filtro.periodo,
    fechaBase
  );

  const [
    ingresos,
    gastos
  ] = await Promise.all([
    prisma.ingreso.findMany({
      where: {
        userId,

        fecha: {
          gte: desde,
          lt: hasta
        }
      },

      select: {
        fecha: true,
        monto: true
      },

      orderBy: {
        fecha: "asc"
      }
    }),

    prisma.gasto.findMany({
      where: {
        userId,

        fecha: {
          gte: desde,
          lt: hasta
        }
      },

      select: {
        fecha: true,
        monto: true
      },

      orderBy: {
        fecha: "asc"
      }
    })
  ]);

  const totalIngresos =
    ingresos.reduce(
      (
        acumulado,
        ingreso
      ) =>
        acumulado +
        convertirMonto(
          ingreso.monto
        ),
      0
    );

  const totalGastos =
    gastos.reduce(
      (
        acumulado,
        gasto
      ) =>
        acumulado +
        convertirMonto(
          gasto.monto
        ),
      0
    );

  let datos:
    PuntoGrafica[];

  switch (filtro.periodo) {
    case "diario":
      datos =
        crearDatosDiarios(
          totalIngresos,
          totalGastos
        );
      break;

    case "semanal":
      datos =
        crearDatosSemanales(
          desde,
          ingresos,
          gastos
        );
      break;

    case "mensual":
      datos =
        crearDatosMensuales(
          fechaBase,
          ingresos,
          gastos
        );
      break;

    case "anual":
      datos =
        crearDatosAnuales(
          ingresos,
          gastos
        );
      break;

    default:
      throw new EstadisticasError(
        "Período no válido"
      );
  }

  return {
    periodo:
      filtro.periodo,

    desde:
      desde
        .toISOString()
        .slice(0, 10),

    hasta:
      new Date(
        hasta.getTime() -
        86400000
      )
        .toISOString()
        .slice(0, 10),

    totalIngresos,

    totalGastos,

    balance:
      totalIngresos -
      totalGastos,

    datos
  };
}
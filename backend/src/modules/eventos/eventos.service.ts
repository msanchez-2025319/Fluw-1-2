import { prisma } from "../../config/prisma.js";

export interface CrearEventoInput {
  fecha: string;
  descripcion: string;
}

export interface ActualizarEventoInput {
  fecha: string;
  descripcion: string;
}

/* =========================
   UTILIDADES
========================= */

function convertirFecha(fecha: string): Date {
  const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

  if (!formatoFecha.test(fecha)) {
    throw new Error(
      "La fecha debe tener el formato YYYY-MM-DD"
    );
  }

  const [anioTexto, mesTexto, diaTexto] =
    fecha.split("-");

  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);

  const fechaConvertida = new Date(
    Date.UTC(
      anio,
      mes - 1,
      dia
    )
  );

  if (
    fechaConvertida.getUTCFullYear() !== anio ||
    fechaConvertida.getUTCMonth() !== mes - 1 ||
    fechaConvertida.getUTCDate() !== dia
  ) {
    throw new Error(
      "La fecha proporcionada no es válida"
    );
  }

  return fechaConvertida;
}

function limpiarDescripcion(
  descripcion: string
): string {
  const descripcionLimpia =
    descripcion.trim();

  if (!descripcionLimpia) {
    throw new Error(
      "La descripción es obligatoria"
    );
  }

  return descripcionLimpia;
}

function formatearFecha(
  fecha: Date
): string {
  const dia = String(
    fecha.getUTCDate()
  ).padStart(2, "0");

  const mes = String(
    fecha.getUTCMonth() + 1
  ).padStart(2, "0");

  const anio =
    fecha.getUTCFullYear();

  return `${dia}/${mes}/${anio}`;
}

/* =========================
   NOTIFICACIÓN DE EVENTO
========================= */

async function crearNotificacionEvento(
  userId: string,
  evento: {
    id: string;
    fecha: Date;
    descripcion: string;
  }
) {
  /*
   * Buscamos una notificación anterior
   * asociada específicamente con este
   * evento.
   *
   * El ID se guarda dentro del mensaje
   * como referencia interna.
   */

  const referencia =
    `[EVENTO:${evento.id}]`;

  const existente =
    await prisma.notificacion.findFirst({
      where: {
        userId,
        tipo: "PROXIMO_EVENTO",

        mensaje: {
          contains: referencia
        }
      }
    });

  if (existente) {
    return;
  }

  const fechaFormateada =
    formatearFecha(evento.fecha);

  await prisma.notificacion.create({
    data: {
      tipo: "PROXIMO_EVENTO",

      titulo:
        "Próximo evento",

      mensaje:
        `${evento.descripcion} - Fecha: ${fechaFormateada} ${referencia}`,

      userId
    }
  });
}

/* =========================
   SINCRONIZAR EVENTOS
========================= */

export async function sincronizarNotificacionesEventos(
  userId: string
) {
  const ahora =
    new Date();

  const inicioHoy =
    new Date(
      Date.UTC(
        ahora.getUTCFullYear(),
        ahora.getUTCMonth(),
        ahora.getUTCDate()
      )
    );

  /*
   * Consideramos "próximo" un evento
   * que ocurre desde hoy hasta los
   * siguientes 7 días.
   */

  const limite =
    new Date(inicioHoy);

  limite.setUTCDate(
    limite.getUTCDate() + 7
  );

  limite.setUTCHours(
    23,
    59,
    59,
    999
  );

  const eventosProximos =
    await prisma.evento.findMany({
      where: {
        userId,

        fecha: {
          gte: inicioHoy,
          lte: limite
        }
      },

      orderBy: {
        fecha: "asc"
      }
    });

  for (
    const evento of eventosProximos
  ) {
    await crearNotificacionEvento(
      userId,
      evento
    );
  }
}

/* =========================
   OBTENER TODOS
========================= */

export async function obtenerEventos(
  userId: string
) {
  return prisma.evento.findMany({
    where: {
      userId
    },

    orderBy: {
      fecha: "asc"
    }
  });
}

/* =========================
   PRÓXIMOS EVENTOS
========================= */

export async function obtenerProximosEventos(
  userId: string
) {
  const hoy = new Date();

  const inicioHoy = new Date(
    Date.UTC(
      hoy.getUTCFullYear(),
      hoy.getUTCMonth(),
      hoy.getUTCDate()
    )
  );

  /*
   * Antes de devolver los eventos
   * sincronizamos las notificaciones.
   *
   * Si el Dashboard consulta próximos
   * eventos, automáticamente se generan
   * las notificaciones que correspondan.
   */

  try {
    await sincronizarNotificacionesEventos(
      userId
    );
  } catch (error) {
    /*
     * Un problema con una notificación
     * no debe impedir que se carguen
     * los eventos.
     */
    console.error(
      "[eventos] Error al sincronizar notificaciones:",
      error
    );
  }

  return prisma.evento.findMany({
    where: {
      userId,

      fecha: {
        gte: inicioHoy
      }
    },

    orderBy: {
      fecha: "asc"
    }
  });
}

/* =========================
   CREAR EVENTO
========================= */

export async function crearEvento(
  userId: string,
  datos: CrearEventoInput
) {
  const fecha =
    convertirFecha(datos.fecha);

  const descripcion =
    limpiarDescripcion(
      datos.descripcion
    );

  const evento =
    await prisma.evento.create({
      data: {
        fecha,
        descripcion,
        userId
      }
    });

  /*
   * Si el nuevo evento está dentro
   * de los próximos 7 días, se genera
   * inmediatamente su notificación.
   */

  try {
    await sincronizarNotificacionesEventos(
      userId
    );
  } catch (error) {
    console.error(
      "[eventos] Error al crear notificación:",
      error
    );
  }

  return evento;
}

/* =========================
   ACTUALIZAR EVENTO
========================= */

export async function actualizarEvento(
  userId: string,
  eventoId: string,
  datos: ActualizarEventoInput
) {
  const fecha =
    convertirFecha(datos.fecha);

  const descripcion =
    limpiarDescripcion(
      datos.descripcion
    );

  const evento =
    await prisma.evento.findFirst({
      where: {
        id: eventoId,
        userId
      }
    });

  if (!evento) {
    throw new Error(
      "Evento no encontrado"
    );
  }

  const eventoActualizado =
    await prisma.evento.update({
      where: {
        id: eventoId
      },

      data: {
        fecha,
        descripcion
      }
    });

  /*
   * Eliminamos la notificación anterior
   * de este evento porque su fecha o
   * descripción pudieron cambiar.
   */

  await prisma.notificacion.deleteMany({
    where: {
      userId,
      tipo: "PROXIMO_EVENTO",

      mensaje: {
        contains:
          `[EVENTO:${eventoId}]`
      }
    }
  });

  try {
    await sincronizarNotificacionesEventos(
      userId
    );
  } catch (error) {
    console.error(
      "[eventos] Error al actualizar notificación:",
      error
    );
  }

  return eventoActualizado;
}

/* =========================
   ELIMINAR EVENTO
========================= */

export async function eliminarEvento(
  userId: string,
  eventoId: string
) {
  const evento =
    await prisma.evento.findFirst({
      where: {
        id: eventoId,
        userId
      }
    });

  if (!evento) {
    throw new Error(
      "Evento no encontrado"
    );
  }

  /*
   * Si eliminamos el evento, también
   * eliminamos su notificación.
   */

  await prisma.notificacion.deleteMany({
    where: {
      userId,
      tipo: "PROXIMO_EVENTO",

      mensaje: {
        contains:
          `[EVENTO:${eventoId}]`
      }
    }
  });

  await prisma.evento.delete({
    where: {
      id: eventoId
    }
  });

  return {
    message:
      "Evento eliminado correctamente"
  };
}
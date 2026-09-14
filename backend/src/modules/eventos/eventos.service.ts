import { prisma } from "../../config/prisma.js";

export interface CrearEventoInput {
  fecha: string;
  descripcion: string;
}

export interface ActualizarEventoInput {
  fecha: string;
  descripcion: string;
}

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

  return prisma.evento.create({
    data: {
      fecha,
      descripcion,
      userId
    }
  });
}

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

  return prisma.evento.update({
    where: {
      id: eventoId
    },

    data: {
      fecha,
      descripcion
    }
  });
}

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

  await prisma.evento.delete({
    where: {
      id: eventoId
    }
  });

  return {
    message: "Evento eliminado correctamente"
  };
}
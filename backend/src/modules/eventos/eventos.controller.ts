import type { Request, Response } from "express";

import {
  actualizarEvento,
  crearEvento,
  eliminarEvento,
  obtenerEventos,
  obtenerProximosEventos
} from "./eventos.service.js";

export async function listarEventos(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Usuario no autenticado"
      });
      return;
    }

    const eventos =
      await obtenerEventos(userId);

    res.status(200).json(eventos);

  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error al obtener los eventos";

    res.status(400).json({
      message: mensaje
    });
  }
}

export async function listarProximosEventos(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Usuario no autenticado"
      });
      return;
    }

    const eventos =
      await obtenerProximosEventos(userId);

    res.status(200).json(eventos);

  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error al obtener los próximos eventos";

    res.status(400).json({
      message: mensaje
    });
  }
}

export async function registrarEvento(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Usuario no autenticado"
      });
      return;
    }

    const {
      fecha,
      descripcion
    } = req.body;

    if (
      typeof fecha !== "string" ||
      !fecha.trim()
    ) {
      res.status(400).json({
        message: "La fecha es obligatoria"
      });
      return;
    }

    if (
      typeof descripcion !== "string" ||
      !descripcion.trim()
    ) {
      res.status(400).json({
        message: "La descripción es obligatoria"
      });
      return;
    }

    const evento =
      await crearEvento(
        userId,
        {
          fecha,
          descripcion
        }
      );

    res.status(201).json(evento);

  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error al crear el evento";

    res.status(400).json({
      message: mensaje
    });
  }
}

export async function editarEvento(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    const parametroId = req.params.id;

    const eventoId =
      Array.isArray(parametroId)
        ? parametroId[0]
        : parametroId;

    if (!userId) {
      res.status(401).json({
        message: "Usuario no autenticado"
      });
      return;
    }

    if (!eventoId) {
      res.status(400).json({
        message: "El ID del evento es obligatorio"
      });
      return;
    }

    const {
      fecha,
      descripcion
    } = req.body;

    if (
      typeof fecha !== "string" ||
      !fecha.trim()
    ) {
      res.status(400).json({
        message: "La fecha es obligatoria"
      });
      return;
    }

    if (
      typeof descripcion !== "string" ||
      !descripcion.trim()
    ) {
      res.status(400).json({
        message: "La descripción es obligatoria"
      });
      return;
    }

    const evento =
      await actualizarEvento(
        userId,
        eventoId,
        {
          fecha,
          descripcion
        }
      );

    res.status(200).json(evento);

  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error al actualizar el evento";

    res.status(400).json({
      message: mensaje
    });
  }
}

export async function borrarEvento(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    const parametroId = req.params.id;

    const eventoId =
      Array.isArray(parametroId)
        ? parametroId[0]
        : parametroId;

    if (!userId) {
      res.status(401).json({
        message: "Usuario no autenticado"
      });
      return;
    }

    if (!eventoId) {
      res.status(400).json({
        message: "El ID del evento es obligatorio"
      });
      return;
    }

    const resultado =
      await eliminarEvento(
        userId,
        eventoId
      );

    res.status(200).json(resultado);

  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error al eliminar el evento";

    res.status(400).json({
      message: mensaje
    });
  }
}
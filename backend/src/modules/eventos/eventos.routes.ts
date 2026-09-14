import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";

import {
  borrarEvento,
  editarEvento,
  listarEventos,
  listarProximosEventos,
  registrarEvento
} from "./eventos.controller.js";

const router = Router();

router.get("/", requireAuth, listarEventos);

router.get(
  "/proximos",
  requireAuth,
  listarProximosEventos
);

router.post(
  "/",
  requireAuth,
  registrarEvento
);

router.put(
  "/:id",
  requireAuth,
  editarEvento
);

router.delete(
  "/:id",
  requireAuth,
  borrarEvento
);

export default router;
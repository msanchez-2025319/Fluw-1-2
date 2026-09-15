import { Router } from "express";

import {
  crear,
  obtener,
  actualizar,
  eliminar,
} from "./ahorros.controller.js";

import {
  requireAuth,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  obtener
);

router.post(
  "/",
  requireAuth,
  crear
);

router.put(
  "/",
  requireAuth,
  actualizar
);

router.delete(
  "/",
  requireAuth,
  eliminar
);

export default router;
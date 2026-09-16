import {
  Router
} from "express";

import {
  requireAuth
} from "../../middlewares/auth.middleware.js";

import {
  actualizar,
  crear,
  eliminar,
  obtener
} from "./gastos-planeados.controller.js";

const router =
  Router();

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
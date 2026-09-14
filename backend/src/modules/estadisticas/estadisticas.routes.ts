import { Router } from "express";

import {
  requireAuth
} from "../../middlewares/auth.middleware.js";

import {
  obtener
} from "./estadisticas.controller.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  obtener
);

export default router;
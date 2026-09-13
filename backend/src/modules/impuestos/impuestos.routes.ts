import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { obtenerImpuestos } from "./impuestos.controller.js";

const router = Router();

router.get("/", requireAuth, obtenerImpuestos);

export default router;
import { Router } from "express";
import { obtenerResumen } from "./impuestos.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// GET /api/impuestos?mes=2026-09  -> resumen del mes indicado (o del mes actual si no se envía "mes")
router.get("/", requireAuth, obtenerResumen);

export default router;
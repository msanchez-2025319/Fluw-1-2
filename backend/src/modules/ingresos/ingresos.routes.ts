import { Router } from "express";
import { crear, listar, obtenerPorId, actualizar, eliminar } from "./ingresos.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, crear);
router.get("/", requireAuth, listar);
router.get("/:id", requireAuth, obtenerPorId);
router.put("/:id", requireAuth, actualizar);
router.delete("/:id", requireAuth, eliminar);

export default router;
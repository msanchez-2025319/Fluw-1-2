import { Router } from "express";
import { login, refresh, me, logout } from "./auth.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);

export default router;

import { Router } from "express";

import {
  login,
  googleLogin,
  refresh,
  me,
  logout
} from "./auth.controller.js";

import {
  requireAuth
} from "../../middlewares/auth.middleware.js";

const router = Router();

/* =========================
   LOGIN TRADICIONAL
========================= */

router.post("/login", login);

/* =========================
   LOGIN / REGISTRO GOOGLE
========================= */

router.post("/google", googleLogin);

/* =========================
   REFRESH
========================= */

router.post("/refresh", refresh);

/* =========================
   USUARIO ACTUAL
========================= */

router.get(
  "/me",
  requireAuth,
  me
);

/* =========================
   LOGOUT
========================= */

router.post(
  "/logout",
  requireAuth,
  logout
);

export default router;
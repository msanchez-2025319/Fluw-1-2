import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/auth.types.js";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.access_token;

  console.log("[AUTH]", req.method, req.originalUrl);
  console.log("[AUTH] access_token:", token ? "EXISTE" : "NO EXISTE");

  if (!token) {
    console.log("[AUTH] 401: no existe access_token");
    return res.status(401).json({ message: "No autenticado" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    console.log("[AUTH] JWT válido:", payload.id);

    req.user = payload;
    next();
  } catch (error) {
    console.error("[AUTH] JWT inválido:", error);

    return res.status(401).json({
      message: "Sesión inválida o expirada",
    });
  }
}
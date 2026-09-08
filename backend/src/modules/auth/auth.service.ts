import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../config/prisma.js";
import type { JwtPayload } from "../../types/auth.types.js";

const JWT_SECRET = process.env.JWT_SECRET as string;
export const ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || "30m";

const SESSION_IDLE_TIMEOUT =
  process.env.SESSION_IDLE_TIMEOUT || "1h";

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);

  if (!match) {
    throw new Error(`Duración inválida: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  const unitsInMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * unitsInMs[unit];
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AuthError("Usuario no encontrado", 404);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AuthError("Contraseña incorrecta", 401);
  }

  const sessionExpiresAt = new Date(
    Date.now() + parseDurationToMs(SESSION_IDLE_TIMEOUT)
  );

  const payload: JwtPayload = {
    id: user.id,
    role: user.role,
    sessionExpiresAt: sessionExpiresAt.toISOString(),
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);

  const rawRefreshToken = crypto.randomBytes(40).toString("hex");

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(rawRefreshToken),
      userId: user.id,
      expiresAt: sessionExpiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    sessionExpiresAt,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

export async function refreshAccessToken(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken || storedToken.revoked) {
    throw new AuthError("Sesión no válida", 401);
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AuthError(
      "La sesión ha expirado, inicia sesión de nuevo",
      401
    );
  }

  // Sliding session: cada renovación con actividad extiende la expiración
  // del refresh token a "ahora + tiempo de inactividad permitido".
  const newExpiresAt = new Date(
    Date.now() + parseDurationToMs(SESSION_IDLE_TIMEOUT)
  );

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { expiresAt: newExpiresAt },
  });

  const payload: JwtPayload = {
    id: storedToken.user.id,
    role: storedToken.user.role,
    sessionExpiresAt: newExpiresAt.toISOString(),
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);

  return {
    accessToken,
    sessionExpiresAt: newExpiresAt,
    user: {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    },
  };
}

export async function logoutUser(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) return;

  const tokenHash = hashToken(rawRefreshToken);

  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  });
}
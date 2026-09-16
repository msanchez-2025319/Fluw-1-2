import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

import { prisma } from "../../config/prisma.js";
import type { JwtPayload } from "../../types/auth.types.js";

const JWT_SECRET = process.env.JWT_SECRET as string;

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID as string;

export const ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || "30m";

const SESSION_IDLE_TIMEOUT =
  process.env.SESSION_IDLE_TIMEOUT || "1h";

const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID
);

export class AuthError extends Error {
  statusCode: number;

  constructor(
    message: string,
    statusCode = 401
  ) {
    super(message);
    this.statusCode = statusCode;
  }
}

/* =========================
   DURACIONES
========================= */

export function parseDurationToMs(
  duration: string
): number {

  const match =
    duration.match(/^(\d+)(s|m|h|d)$/);

  if (!match) {
    throw new Error(
      `Duración inválida: ${duration}`
    );
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

/* =========================
   HASH REFRESH TOKEN
========================= */

function hashToken(
  token: string
): string {

  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

/* =========================
   CREAR SESIÓN
========================= */

/**
 * Genera la misma sesión para:
 *
 * - Login tradicional.
 * - Login con Google.
 *
 * De esta manera Google no crea
 * un sistema de sesión diferente.
 */
async function createSession(
  user: {
    id: string;
    email: string;
    role: "ADMIN" | "USER";
  }
) {

  const sessionExpiresAt = new Date(
    Date.now() +
    parseDurationToMs(
      SESSION_IDLE_TIMEOUT
    )
  );

  const payload: JwtPayload = {
    id: user.id,
    role: user.role,
    sessionExpiresAt:
      sessionExpiresAt.toISOString(),
  };

  const accessToken = jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn:
        ACCESS_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions
  );

  const rawRefreshToken =
    crypto
      .randomBytes(40)
      .toString("hex");

  await prisma.refreshToken.create({
    data: {
      tokenHash:
        hashToken(rawRefreshToken),

      userId:
        user.id,

      expiresAt:
        sessionExpiresAt,
    },
  });

  return {
    accessToken,

    refreshToken:
      rawRefreshToken,

    sessionExpiresAt,

    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

/* =========================
   LOGIN TRADICIONAL
========================= */

export async function loginUser(
  email: string,
  password: string
) {

  const normalizedEmail =
    email.trim().toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      },
    });

  if (!user) {
    throw new AuthError(
      "Usuario no encontrado",
      404
    );
  }

  /*
   * Un usuario creado exclusivamente
   * mediante Google no tiene contraseña.
   */
  if (!user.password) {

    throw new AuthError(
      "Esta cuenta utiliza inicio de sesión con Google",
      401
    );
  }

  const isPasswordValid =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!isPasswordValid) {

    throw new AuthError(
      "Contraseña incorrecta",
      401
    );
  }

  return createSession(user);
}

/* =========================
   LOGIN CON GOOGLE
========================= */

export async function loginWithGoogle(
  credential: string
) {

  if (!GOOGLE_CLIENT_ID) {

    console.error(
      "[auth/google] GOOGLE_CLIENT_ID no está configurado"
    );

    throw new AuthError(
      "Google Login no está configurado",
      500
    );
  }

  let ticket;

  try {

    ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });

  } catch (error) {

    console.error(
      "[auth/google] Token de Google inválido:",
      error
    );

    throw new AuthError(
      "Credencial de Google inválida",
      401
    );
  }

  const payload =
    ticket.getPayload();

  if (
    !payload ||
    !payload.sub ||
    !payload.email
  ) {

    throw new AuthError(
      "Google no proporcionó la información necesaria",
      401
    );
  }

  if (payload.email_verified !== true) {

    throw new AuthError(
      "El correo de Google no está verificado",
      401
    );
  }

  const googleId =
    payload.sub;

  const email =
    payload.email
      .trim()
      .toLowerCase();

  /*
   * Primero buscamos por el ID estable
   * proporcionado por Google.
   */
  let user =
    await prisma.user.findUnique({
      where: {
        googleId
      },
    });

  if (user) {

    return createSession(user);
  }

  /*
   * Si Google todavía no está vinculado,
   * comprobamos si el correo ya pertenece
   * a un usuario de Fluw.
   */
  const existingUser =
    await prisma.user.findUnique({
      where: {
        email
      },
    });

  if (existingUser) {

    /*
     * IMPORTANTE:
     *
     * No modificamos automáticamente una
     * cuenta LOCAL existente.
     *
     * Esto mantiene intactos tus usuarios
     * ADMIN y USER actuales.
     */
    if (
      existingUser.authProvider === "LOCAL"
    ) {

      throw new AuthError(
        "Este correo ya pertenece a una cuenta de Fluw. Inicia sesión con tu correo y contraseña.",
        409
      );
    }

    /*
     * Caso defensivo:
     * cuenta GOOGLE sin googleId.
     */
    user =
      await prisma.user.update({
        where: {
          id: existingUser.id
        },

        data: {
          googleId
        },
      });

    return createSession(user);
  }

  /*
   * Primera vez que esta cuenta
   * de Google entra a Fluw.
   *
   * Prisma genera automáticamente:
   * - id
   * - role USER
   * - createdAt
   * - updatedAt
   */
  user =
    await prisma.user.create({
      data: {
        email,
        password: null,
        googleId,
        authProvider: "GOOGLE",
        role: "USER",
      },
    });

  return createSession(user);
}

/* =========================
   REFRESH
========================= */

export async function refreshAccessToken(
  rawRefreshToken: string
) {

  const tokenHash =
    hashToken(rawRefreshToken);

  const storedToken =
    await prisma.refreshToken.findUnique({
      where: {
        tokenHash
      },

      include: {
        user: true
      },
    });

  if (
    !storedToken ||
    storedToken.revoked
  ) {

    throw new AuthError(
      "Sesión no válida",
      401
    );
  }

  if (
    storedToken.expiresAt <
    new Date()
  ) {

    throw new AuthError(
      "La sesión ha expirado, inicia sesión de nuevo",
      401
    );
  }

  const newExpiresAt =
    new Date(
      Date.now() +
      parseDurationToMs(
        SESSION_IDLE_TIMEOUT
      )
    );

  await prisma.refreshToken.update({
    where: {
      id: storedToken.id
    },

    data: {
      expiresAt:
        newExpiresAt,
    },
  });

  const payload: JwtPayload = {
    id:
      storedToken.user.id,

    role:
      storedToken.user.role,

    sessionExpiresAt:
      newExpiresAt.toISOString(),
  };

  const accessToken =
    jwt.sign(
      payload,
      JWT_SECRET,
      {
        expiresIn:
          ACCESS_TOKEN_EXPIRES_IN,
      } as jwt.SignOptions
    );

  return {
    accessToken,

    sessionExpiresAt:
      newExpiresAt,

    user: {
      id:
        storedToken.user.id,

      email:
        storedToken.user.email,

      role:
        storedToken.user.role,
    },
  };
}

/* =========================
   LOGOUT
========================= */

export async function logoutUser(
  rawRefreshToken:
    string | undefined
) {

  if (!rawRefreshToken) {
    return;
  }

  const tokenHash =
    hashToken(rawRefreshToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash
    },

    data: {
      revoked: true,
    },
  });
}
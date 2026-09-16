import type {
  Request,
  Response
} from "express";

import {
  loginUser,
  refreshAccessToken,
  logoutUser,
  AuthError,
  parseDurationToMs,
  ACCESS_TOKEN_EXPIRES_IN,
} from "./auth.service.js";

import {
  prisma
} from "../../config/prisma.js";

const isProduction =
  process.env.NODE_ENV === "production";

/* =========================
   LOGIN
========================= */

export async function login(
  req: Request,
  res: Response
) {

  const {
    email,
    password
  } = req.body;

  if (!email || !password) {

    return res.status(400).json({
      message:
        "Email y contraseña son obligatorios"
    });
  }

  try {

    const {
      accessToken,
      refreshToken,
      sessionExpiresAt,
      user
    } = await loginUser(
      email,
      password
    );

    /* =========================
       NOTIFICACIÓN DE LOGIN
    ========================= */

    try {

      await prisma.notificacion.create({
        data: {
          tipo: "INICIO_SESION",
          titulo: "Inicio de sesión",
          mensaje:
            `Se inició sesión correctamente con la cuenta ${user.email}.`,
          userId: user.id
        }
      });

    } catch (notificationError) {

      /*
       * Una falla al guardar la notificación
       * no debe impedir que el usuario
       * pueda iniciar sesión.
       */
      console.error(
        "[auth] Error al crear notificación de inicio de sesión:",
        notificationError
      );
    }

    /* =========================
       COOKIES
    ========================= */

    res.cookie(
      "access_token",
      accessToken,
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        maxAge:
          parseDurationToMs(
            ACCESS_TOKEN_EXPIRES_IN
          ),
        path: "/",
      }
    );

    res.cookie(
      "refresh_token",
      refreshToken,
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        expires: sessionExpiresAt,
        path: "/",
      }
    );

    return res.status(200).json({
      message: "Login exitoso",
      user,
      sessionExpiresAt,
    });

  } catch (error) {

    if (error instanceof AuthError) {

      return res
        .status(error.statusCode)
        .json({
          message: error.message
        });
    }

    console.error(error);

    return res.status(500).json({
      message:
        "Error interno del servidor"
    });
  }
}

/* =========================
   REFRESH
========================= */

export async function refresh(
  req: Request,
  res: Response
) {

  const rawRefreshToken =
    req.cookies?.refresh_token;

  if (!rawRefreshToken) {

    return res.status(401).json({
      message:
        "No hay sesión activa"
    });
  }

  try {

    const {
      accessToken,
      user,
      sessionExpiresAt
    } = await refreshAccessToken(
      rawRefreshToken
    );

    res.cookie(
      "access_token",
      accessToken,
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        maxAge:
          parseDurationToMs(
            ACCESS_TOKEN_EXPIRES_IN
          ),
        path: "/",
      }
    );

    return res.status(200).json({
      message: "Sesión renovada",
      user,
      sessionExpiresAt
    });

  } catch (error) {

    if (error instanceof AuthError) {

      return res
        .status(error.statusCode)
        .json({
          message: error.message
        });
    }

    console.error(error);

    return res.status(500).json({
      message:
        "Error interno del servidor"
    });
  }
}

/* =========================
   USUARIO ACTUAL
========================= */

export function me(
  req: Request,
  res: Response
) {

  return res.status(200).json({
    user: req.user
  });
}

/* =========================
   LOGOUT
========================= */

export async function logout(
  req: Request,
  res: Response
) {

  const rawRefreshToken =
    req.cookies?.refresh_token;

  await logoutUser(
    rawRefreshToken
  );

  res.clearCookie(
    "access_token",
    {
      path: "/"
    }
  );

  res.clearCookie(
    "refresh_token",
    {
      path: "/"
    }
  );

  return res.status(200).json({
    message:
      "Sesión cerrada"
  });
}
import type {
  Request,
  Response
} from "express";

import {
  loginUser,
  loginWithGoogle,
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
   CONFIGURAR COOKIES
========================= */

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  sessionExpiresAt: Date
) {

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
}

/* =========================
   CREAR NOTIFICACIÓN LOGIN
========================= */

async function crearNotificacionLogin(
  user: {
    id: string;
    email: string;
  },
  google = false
) {

  try {

    await prisma.notificacion.create({
      data: {
        tipo: "INICIO_SESION",
        titulo: "Inicio de sesión",
        mensaje: google
          ? `Se inició sesión con Google correctamente con la cuenta ${user.email}.`
          : `Se inició sesión correctamente con la cuenta ${user.email}.`,
        userId: user.id
      }
    });

  } catch (notificationError) {

    /*
     * Una falla en las notificaciones
     * nunca debe impedir el inicio
     * de sesión.
     */
    console.error(
      "[auth] Error al crear notificación de inicio de sesión:",
      notificationError
    );
  }
}

/* =========================
   LOGIN TRADICIONAL
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

    await crearNotificacionLogin(
      user
    );

    setAuthCookies(
      res,
      accessToken,
      refreshToken,
      sessionExpiresAt
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

    console.error(
      "[auth/login] Error:",
      error
    );

    return res.status(500).json({
      message:
        "Error interno del servidor"
    });
  }
}

/* =========================
   LOGIN CON GOOGLE
========================= */

export async function googleLogin(
  req: Request,
  res: Response
) {

  const {
    credential
  } = req.body;

  if (
    !credential ||
    typeof credential !== "string"
  ) {

    return res.status(400).json({
      message:
        "La credencial de Google es obligatoria"
    });
  }

  try {

    const {
      accessToken,
      refreshToken,
      sessionExpiresAt,
      user
    } = await loginWithGoogle(
      credential
    );

    /*
     * Creamos la misma notificación
     * de inicio de sesión utilizada
     * por Fluw.
     */
    await crearNotificacionLogin(
      user,
      true
    );

    /*
     * Google utiliza exactamente
     * las mismas cookies y sesión
     * que el login tradicional.
     */
    setAuthCookies(
      res,
      accessToken,
      refreshToken,
      sessionExpiresAt
    );

    return res.status(200).json({
      message:
        "Inicio de sesión con Google exitoso",
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

    console.error(
      "[auth/google] Error:",
      error
    );

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

    console.error(
      "[auth/refresh] Error:",
      error
    );

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
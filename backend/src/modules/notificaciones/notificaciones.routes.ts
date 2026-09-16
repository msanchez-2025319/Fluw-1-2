import {
  Router
} from 'express';

import {
  requireAuth
} from '../../middlewares/auth.middleware.js';

import {
  eliminar,
  leer,
  leerTodas,
  listar
} from './notificaciones.controller.js';

const router =
  Router();

router.get(
  '/',
  requireAuth,
  listar
);

router.patch(
  '/leer-todas',
  requireAuth,
  leerTodas
);

router.patch(
  '/:id/leer',
  requireAuth,
  leer
);

router.delete(
  '/:id',
  requireAuth,
  eliminar
);

export default router;
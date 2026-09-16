export type TipoNotificacion =
  | 'INICIO_SESION'
  | 'PROXIMO_EVENTO'
  | 'META_AHORRO'
  | 'IMPUESTOS'
  | 'FONDO_EMERGENCIA'
  | 'LIMITE_GASTOS';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificacionesResponse {
  notificaciones: Notificacion[];
  noLeidas: number;
}
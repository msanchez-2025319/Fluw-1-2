import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  inject,
  signal
} from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../../services/auth.service';
import { NotificacionesService } from '../../../../services/notificaciones.service';

import {
  Notificacion
} from '../../models/notificacion.model';

@Component({
  selector: 'app-notificaciones-modal',
  standalone: true,
  imports: [],
  templateUrl: './notificaciones-modal.html',
  styleUrl: './notificaciones-modal.css'
})
export class NotificacionesModal implements OnInit {

  private authService =
    inject(AuthService);

  private notificacionesService =
    inject(NotificacionesService);

  @Output()
  cerrar =
    new EventEmitter<void>();

  @Output()
  notificacionesActualizadas =
    new EventEmitter<number>();

  notificaciones =
    signal<Notificacion[]>([]);

  cargando =
    signal(true);

  procesando =
    signal(false);

  error =
    signal<string | null>(null);

  noLeidas =
    signal(0);

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  /* =========================
     USUARIO
  ========================= */

  obtenerCorreoUsuario(): string {

    const usuario =
      this.authService.currentUser();

    return usuario?.email ??
      'Usuario';
  }

  /* =========================
     CARGAR NOTIFICACIONES
  ========================= */

  cargarNotificaciones(): void {

    this.cargando.set(true);
    this.error.set(null);

    this.notificacionesService
      .obtenerNotificaciones()
      .subscribe({

        next: res => {

          this.notificaciones.set(
            res.notificaciones ?? []
          );

          this.noLeidas.set(
            res.noLeidas ?? 0
          );

          this.notificacionesActualizadas.emit(
            res.noLeidas ?? 0
          );

          this.cargando.set(false);
        },

        error: (
          err: HttpErrorResponse
        ) => {

          console.error(
            '[notificaciones] Error al cargar:',
            err
          );

          this.error.set(
            err.error?.message ??
            'No se pudieron cargar las notificaciones'
          );

          this.cargando.set(false);
        }
      });
  }

  /* =========================
     MARCAR UNA COMO LEÍDA
  ========================= */

  marcarComoLeida(
    notificacion: Notificacion
  ): void {

    if (
      notificacion.leida ||
      this.procesando()
    ) {
      return;
    }

    this.procesando.set(true);

    this.notificacionesService
      .marcarComoLeida(
        notificacion.id
      )
      .subscribe({

        next: res => {

          this.notificaciones.update(
            notificaciones =>
              notificaciones.map(item =>
                item.id === notificacion.id
                  ? {
                      ...item,
                      leida: true
                    }
                  : item
              )
          );

          const nuevasNoLeidas =
            Math.max(
              0,
              this.noLeidas() - 1
            );

          this.noLeidas.set(
            nuevasNoLeidas
          );

          this.notificacionesActualizadas.emit(
            nuevasNoLeidas
          );

          this.procesando.set(false);
        },

        error: (
          err: HttpErrorResponse
        ) => {

          console.error(
            '[notificaciones] Error al marcar como leída:',
            err
          );

          this.error.set(
            err.error?.message ??
            'No se pudo actualizar la notificación'
          );

          this.procesando.set(false);
        }
      });
  }

  /* =========================
     MARCAR TODAS
  ========================= */

  marcarTodasComoLeidas(): void {

    if (
      this.noLeidas() === 0 ||
      this.procesando()
    ) {
      return;
    }

    this.procesando.set(true);
    this.error.set(null);

    this.notificacionesService
      .marcarTodasComoLeidas()
      .subscribe({

        next: () => {

          this.notificaciones.update(
            notificaciones =>
              notificaciones.map(
                notificacion => ({
                  ...notificacion,
                  leida: true
                })
              )
          );

          this.noLeidas.set(0);

          this.notificacionesActualizadas.emit(
            0
          );

          this.procesando.set(false);
        },

        error: (
          err: HttpErrorResponse
        ) => {

          console.error(
            '[notificaciones] Error al marcar todas como leídas:',
            err
          );

          this.error.set(
            err.error?.message ??
            'No se pudieron actualizar las notificaciones'
          );

          this.procesando.set(false);
        }
      });
  }

  /* =========================
     ELIMINAR
  ========================= */

  eliminar(
    notificacion: Notificacion,
    event: Event
  ): void {

    event.stopPropagation();

    if (this.procesando()) {
      return;
    }

    this.procesando.set(true);
    this.error.set(null);

    this.notificacionesService
      .eliminarNotificacion(
        notificacion.id
      )
      .subscribe({

        next: () => {

          this.notificaciones.update(
            notificaciones =>
              notificaciones.filter(
                item =>
                  item.id !==
                  notificacion.id
              )
          );

          let nuevasNoLeidas =
            this.noLeidas();

          if (!notificacion.leida) {

            nuevasNoLeidas =
              Math.max(
                0,
                nuevasNoLeidas - 1
              );

            this.noLeidas.set(
              nuevasNoLeidas
            );
          }

          this.notificacionesActualizadas.emit(
            nuevasNoLeidas
          );

          this.procesando.set(false);
        },

        error: (
          err: HttpErrorResponse
        ) => {

          console.error(
            '[notificaciones] Error al eliminar:',
            err
          );

          this.error.set(
            err.error?.message ??
            'No se pudo eliminar la notificación'
          );

          this.procesando.set(false);
        }
      });
  }

  /* =========================
     LIMPIAR MENSAJE
  ========================= */

  obtenerMensajeLimpio(
    mensaje: string
  ): string {

    /*
     * Oculta referencias internas como:
     *
     * [EVENTO:uuid]
     * [AHORRO:uuid:META:1000.00]
     * [IMPUESTOS:2026-09]
     * [GASTO_PLANEADO:uuid:MENSUAL:2026-09]
     */

    return mensaje
      .replace(
        /\s*\[[A-Z_]+:[^\]]+\]\s*$/g,
        ''
      )
      .trim();
  }

  /* =========================
     FECHA
  ========================= */

  formatearFecha(
    fecha: string
  ): string {

    const valor =
      new Date(fecha);

    if (
      Number.isNaN(
        valor.getTime()
      )
    ) {
      return '';
    }

    return new Intl.DateTimeFormat(
      'es-GT',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    ).format(valor);
  }

  /* =========================
     CERRAR
  ========================= */

  cerrarModal(): void {
    this.cerrar.emit();
  }
}
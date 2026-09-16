import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import {
  Notificacion,
  NotificacionesResponse
} from '../features/notificaciones/models/notificacion.model';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  private readonly apiUrl =
    `${environment.apiUrl}/notificaciones`;

  constructor(
    private http: HttpClient
  ) {}

  obtenerNotificaciones():
    Observable<NotificacionesResponse> {

    return this.http.get<NotificacionesResponse>(
      this.apiUrl,
      {
        withCredentials: true
      }
    );
  }

  marcarComoLeida(
    id: string
  ): Observable<{
    message: string;
    notificacion: Notificacion;
  }> {

    return this.http.patch<{
      message: string;
      notificacion: Notificacion;
    }>(
      `${this.apiUrl}/${id}/leer`,
      {},
      {
        withCredentials: true
      }
    );
  }

  marcarTodasComoLeidas():
    Observable<{
      message: string;
    }> {

    return this.http.patch<{
      message: string;
    }>(
      `${this.apiUrl}/leer-todas`,
      {},
      {
        withCredentials: true
      }
    );
  }

  eliminarNotificacion(
    id: string
  ): Observable<{
    message: string;
  }> {

    return this.http.delete<{
      message: string;
    }>(
      `${this.apiUrl}/${id}`,
      {
        withCredentials: true
      }
    );
  }
}
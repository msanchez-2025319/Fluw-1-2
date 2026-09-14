import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Evento {
  id: string;
  fecha: string;
  descripcion: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrearEvento {
  fecha: string;
  descripcion: string;
}

export interface ActualizarEvento {
  fecha: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventosService {

  private readonly apiUrl =
    `${environment.apiUrl}/eventos`;

  constructor(
    private http: HttpClient
  ) {}

  obtenerEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(
      this.apiUrl,
      {
        withCredentials: true
      }
    );
  }

  obtenerProximosEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(
      `${this.apiUrl}/proximos`,
      {
        withCredentials: true
      }
    );
  }

  crearEvento(
    datos: CrearEvento
  ): Observable<Evento> {
    return this.http.post<Evento>(
      this.apiUrl,
      datos,
      {
        withCredentials: true
      }
    );
  }

  actualizarEvento(
    id: string,
    datos: ActualizarEvento
  ): Observable<Evento> {
    return this.http.put<Evento>(
      `${this.apiUrl}/${id}`,
      datos,
      {
        withCredentials: true
      }
    );
  }

  eliminarEvento(
    id: string
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${id}`,
      {
        withCredentials: true
      }
    );
  }
}
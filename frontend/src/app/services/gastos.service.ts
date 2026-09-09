import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  Gasto,
  GastoInput
} from '../features/gastos/models/gasto.model';

@Injectable({
  providedIn: 'root'
})
export class GastosService {

  private readonly baseUrl = `${environment.apiUrl}/gastos`;

  constructor(private readonly http: HttpClient) {}

  crear(input: GastoInput): Observable<{ message: string; gasto: Gasto }> {
    return this.http.post<{ message: string; gasto: Gasto }>(
      this.baseUrl,
      input,
      { withCredentials: true }
    );
  }

  listar(): Observable<{ gastos: Gasto[] }> {
    return this.http.get<{ gastos: Gasto[] }>(
      this.baseUrl,
      { withCredentials: true }
    );
  }

  obtenerPorId(id: number): Observable<{ gasto: Gasto }> {
    return this.http.get<{ gasto: Gasto }>(
      `${this.baseUrl}/${id}`,
      { withCredentials: true }
    );
  }

  actualizar(
    id: number,
    input: GastoInput
  ): Observable<{ message: string; gasto: Gasto }> {
    return this.http.put<{ message: string; gasto: Gasto }>(
      `${this.baseUrl}/${id}`,
      input,
      { withCredentials: true }
    );
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/${id}`,
      { withCredentials: true }
    );
  }
}

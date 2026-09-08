import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Ingreso, IngresoInput, IngresoResponse, IngresosListResponse, FiltroIngresos,
} from '../features/ingresos/models/ingreso.model';

@Injectable({ providedIn: 'root' })
export class IngresosService {
  private readonly apiUrl = `${environment.apiUrl}/ingresos`;

  constructor(private http: HttpClient) {}

  crear(input: IngresoInput): Observable<IngresoResponse> {
    return this.http.post<IngresoResponse>(this.apiUrl, input, { withCredentials: true });
  }

  listar(filtro: FiltroIngresos = {}): Observable<IngresosListResponse> {
    let params = new HttpParams();
    if (filtro.tipo) params = params.set('tipo', filtro.tipo);
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    return this.http.get<IngresosListResponse>(this.apiUrl, { params, withCredentials: true });
  }

  obtenerPorId(id: string): Observable<{ ingreso: Ingreso }> {
    return this.http.get<{ ingreso: Ingreso }>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  actualizar(id: string, input: IngresoInput): Observable<IngresoResponse> {
    return this.http.put<IngresoResponse>(`${this.apiUrl}/${id}`, input, { withCredentials: true });
  }

  eliminar(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
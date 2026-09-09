import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ImpuestosResponse } from '../features/impuestos/models/impuesto.model';

@Injectable({ providedIn: 'root' })
export class ImpuestosService {
  private readonly apiUrl = `${environment.apiUrl}/impuestos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el resumen de impuestos del mes indicado (formato "YYYY-MM").
   * Si no se pasa "mes", el backend usa el mes actual.
   */
  obtenerResumen(mes?: string): Observable<ImpuestosResponse> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    return this.http.get<ImpuestosResponse>(this.apiUrl, { params, withCredentials: true });
  }
}
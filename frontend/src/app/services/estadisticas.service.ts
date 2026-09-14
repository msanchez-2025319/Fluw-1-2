import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Injectable,
  inject
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import {
  environment
} from '../../environments/environment';

export type PeriodoEstadistica =
  | 'diario'
  | 'semanal'
  | 'mensual'
  | 'anual';

export interface PuntoEstadistica {
  etiqueta: string;
  ingresos: number;
  gastos: number;
}

export interface ResultadoEstadisticas {
  periodo: PeriodoEstadistica;
  desde: string;
  hasta: string;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  datos: PuntoEstadistica[];
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {

  private http =
    inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/estadisticas`;

  obtener(
    periodo: PeriodoEstadistica = 'semanal',
    fecha?: string
  ): Observable<ResultadoEstadisticas> {

    let params =
      new HttpParams()
        .set(
          'periodo',
          periodo
        );

    if (fecha) {
      params =
        params.set(
          'fecha',
          fecha
        );
    }

    return this.http.get<ResultadoEstadisticas>(
      this.apiUrl,
      {
        params,
        withCredentials: true
      }
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ResumenImpuestos {
  mes: string;

  ingresosExtra: {
    total: number;
    impuesto: number;
  };

  ingresosVariables: {
    total: number;
    impuesto: number;
  };

  totalImpuestos: number;
}

@Injectable({
  providedIn: 'root',
})
export class ImpuestosService {
  private readonly apiUrl = `${environment.apiUrl}/impuestos`;

  constructor(private http: HttpClient) {}

  obtenerResumen(mes: string): Observable<ResumenImpuestos> {
    const params = new HttpParams().set('mes', mes);

    return this.http.get<ResumenImpuestos>(this.apiUrl, {
      params,
      withCredentials: true,
    });
  }
}
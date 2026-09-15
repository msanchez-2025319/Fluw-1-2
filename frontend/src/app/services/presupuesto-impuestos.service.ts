import {
  HttpClient
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

import {
  PresupuestoImpuestoDeleteResponse,
  PresupuestoImpuestoInput,
  PresupuestoImpuestoMutationResponse,
  PresupuestoImpuestoResponse
} from '../features/impuestos/models/presupuesto-impuesto.model';

@Injectable({
  providedIn: 'root'
})
export class PresupuestoImpuestosService {

  private http =
    inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/presupuesto-impuestos`;

  obtener():
    Observable<PresupuestoImpuestoResponse> {

    return this.http.get<PresupuestoImpuestoResponse>(
      this.apiUrl,
      {
        withCredentials: true
      }
    );
  }

  crear(
    input: PresupuestoImpuestoInput
  ): Observable<PresupuestoImpuestoMutationResponse> {

    return this.http.post<PresupuestoImpuestoMutationResponse>(
      this.apiUrl,
      input,
      {
        withCredentials: true
      }
    );
  }

  actualizar(
    input: PresupuestoImpuestoInput
  ): Observable<PresupuestoImpuestoMutationResponse> {

    return this.http.put<PresupuestoImpuestoMutationResponse>(
      this.apiUrl,
      input,
      {
        withCredentials: true
      }
    );
  }

  eliminar():
    Observable<PresupuestoImpuestoDeleteResponse> {

    return this.http.delete<PresupuestoImpuestoDeleteResponse>(
      this.apiUrl,
      {
        withCredentials: true
      }
    );
  }
}
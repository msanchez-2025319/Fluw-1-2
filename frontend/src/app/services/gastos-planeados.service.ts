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
  GastoPlaneadoDeleteResponse,
  GastoPlaneadoInput,
  GastoPlaneadoMutationResponse,
  GastoPlaneadoResponse
} from '../features/gastos-planeados/models/gasto-planeado.model';

@Injectable({
  providedIn: 'root'
})
export class GastosPlaneadosService {

  private http =
    inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/gastos-planeados`;

  obtener():
    Observable<GastoPlaneadoResponse> {

    return this.http.get<GastoPlaneadoResponse>(
      this.apiUrl,
      {
        withCredentials: true
      }
    );
  }

  crear(
    input: GastoPlaneadoInput
  ): Observable<GastoPlaneadoMutationResponse> {

    return this.http.post<GastoPlaneadoMutationResponse>(
      this.apiUrl,
      input,
      {
        withCredentials: true
      }
    );
  }

  actualizar(
    input: GastoPlaneadoInput
  ): Observable<GastoPlaneadoMutationResponse> {

    return this.http.put<GastoPlaneadoMutationResponse>(
      this.apiUrl,
      input,
      {
        withCredentials: true
      }
    );
  }

  eliminar():
    Observable<GastoPlaneadoDeleteResponse> {

    return this.http.delete<GastoPlaneadoDeleteResponse>(
      this.apiUrl,
      {
        withCredentials: true
      }
    );
  }
}
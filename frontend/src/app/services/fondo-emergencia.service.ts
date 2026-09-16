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
  FondoEmergenciaDeleteResponse,
  FondoEmergenciaInput,
  FondoEmergenciaMutationResponse,
  FondoEmergenciaResponse
} from '../features/fondo-emergencia/models/fondo-emergencia.model';

@Injectable({
  providedIn: 'root'
})
export class FondoEmergenciaService {

  private http =
    inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/fondo-emergencia`;

  obtener():
    Observable<FondoEmergenciaResponse> {

    return this.http.get<FondoEmergenciaResponse>(
      this.apiUrl,
      {
        withCredentials: true
      }
    );
  }

  crear(
    input: FondoEmergenciaInput
  ): Observable<FondoEmergenciaMutationResponse> {

    return this.http.post<FondoEmergenciaMutationResponse>(
      this.apiUrl,
      input,
      {
        withCredentials: true
      }
    );
  }

  actualizar(
    input: FondoEmergenciaInput
  ): Observable<FondoEmergenciaMutationResponse> {

    return this.http.put<FondoEmergenciaMutationResponse>(
      this.apiUrl,
      input,
      {
        withCredentials: true
      }
    );
  }

  eliminar():
    Observable<FondoEmergenciaDeleteResponse> {

    return this.http.delete<FondoEmergenciaDeleteResponse>(
      this.apiUrl,
      {
        withCredentials: true
      }
    );
  }
}
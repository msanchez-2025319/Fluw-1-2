import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AhorroInput,
  AhorroResponse,
  AhorroMutationResponse,
  AhorroDeleteResponse
} from '../features/ahorros/models/ahorro.model';

@Injectable({
  providedIn: 'root'
})
export class AhorrosService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/api/ahorros';

  obtener(): Observable<AhorroResponse> {
    return this.http.get<AhorroResponse>(
      this.apiUrl,
      {
        withCredentials: true
      }
    );
  }

  crear(
    input: AhorroInput
  ): Observable<AhorroMutationResponse> {
    return this.http.post<AhorroMutationResponse>(
      this.apiUrl,
      input,
      {
        withCredentials: true
      }
    );
  }

  actualizar(
    input: AhorroInput
  ): Observable<AhorroMutationResponse> {
    return this.http.put<AhorroMutationResponse>(
      this.apiUrl,
      input,
      {
        withCredentials: true
      }
    );
  }

  eliminar(): Observable<AhorroDeleteResponse> {
    return this.http.delete<AhorroDeleteResponse>(
      this.apiUrl,
      {
        withCredentials: true
      }
    );
  }
}
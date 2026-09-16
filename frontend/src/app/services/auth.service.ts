import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  of,
  tap
} from 'rxjs';

import { environment } from '../../environments/environment';

/* =========================
   RESPUESTA DE LOGIN
========================= */

export interface LoginResponse {
  message: string;

  user: {
    id: string;
    email: string;
    role: 'ADMIN' | 'USER';
  };

  sessionExpiresAt: string;
}

/* =========================
   USUARIO ACTUAL
========================= */

export interface MeResponse {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

/* =========================
   AUTH SERVICE
========================= */

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl =
    `${environment.apiUrl}/auth`;

  currentUser =
    signal<MeResponse | null>(null);

  constructor(
    private http: HttpClient
  ) {}

  /* =========================
     INICIALIZAR SESIÓN
  ========================= */

  init(): Observable<MeResponse | null> {

    return this.http
      .get<MeResponse>(
        `${this.apiUrl}/me`,
        {
          withCredentials: true
        }
      )
      .pipe(

        tap(user => {
          this.currentUser.set(user);
        }),

        catchError(() => {

          this.currentUser.set(null);

          return of(null);
        })
      );
  }

  /* =========================
     LOGIN TRADICIONAL
  ========================= */

  login(
    email: string,
    password: string
  ): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/login`,
        {
          email,
          password
        },
        {
          withCredentials: true
        }
      )
      .pipe(

        tap(response => {
          this.currentUser.set(
            response.user
          );
        })
      );
  }

  /* =========================
     LOGIN CON GOOGLE
  ========================= */

  googleLogin(
    credential: string
  ): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/google`,
        {
          credential
        },
        {
          withCredentials: true
        }
      )
      .pipe(

        tap(response => {
          this.currentUser.set(
            response.user
          );
        })
      );
  }

  /* =========================
     REFRESH
  ========================= */

  refresh(): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/refresh`,
        {},
        {
          withCredentials: true
        }
      )
      .pipe(

        tap(response => {
          this.currentUser.set(
            response.user
          );
        })
      );
  }

  /* =========================
     LOGOUT
  ========================= */

  logout():
    Observable<{ message: string }> {

    return this.http
      .post<{ message: string }>(
        `${this.apiUrl}/logout`,
        {},
        {
          withCredentials: true
        }
      )
      .pipe(

        tap(() => {
          this.currentUser.set(null);
        })
      );
  }

  /* =========================
     OBTENER USUARIO ACTUAL
  ========================= */

  getMe(): Observable<MeResponse> {

    return this.http
      .get<MeResponse>(
        `${this.apiUrl}/me`,
        {
          withCredentials: true
        }
      );
  }
}
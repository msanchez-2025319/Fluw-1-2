import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: 'ADMIN' | 'USER';
  };
  sessionExpiresAt: string;
}

export interface MeResponse {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { email, password },
      { withCredentials: true }
    );
  }

  refresh(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/refresh`,
      {},
      { withCredentials: true }
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true }
    );
  }

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/me`, {
      withCredentials: true,
    });
  }
}
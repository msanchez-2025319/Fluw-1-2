import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const http = inject(HttpClient);
  const router = inject(Router);

  return http.get(`${environment.apiUrl}/auth/me`, { withCredentials: true }).pipe(
    map(() => true),
    catchError(() => {
      router.navigateByUrl('/session-expired');
      return of(false);
    })
  );
};
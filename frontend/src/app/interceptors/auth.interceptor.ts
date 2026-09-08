import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SessionTimerService } from '../services/session-timer.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  if (req.headers.get('X-Guard-Check') === 'true') {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const sessionTimer = inject(SessionTimerService);
        return authService.refresh().pipe(
          switchMap((response) => {
            sessionTimer.schedule(response.sessionExpiresAt);
            return next(req);
          }),
          catchError(() => {
            authService.currentUser.set(null);
            router.navigateByUrl('/login');
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

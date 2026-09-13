import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
  },
  // ❌ ELIMINAR ESTA RUTA
  // {
  //   path: 'gastos',
  //   loadComponent: () => import('./features/gastos/gastos.component').then(m => m.GastosComponent)
  // },
  {
    path: 'session-expired',
    loadComponent: () =>
      import('./features/session-expired/session-expired').then((m) => m.SessionExpired),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
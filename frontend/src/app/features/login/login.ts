import {
  AfterViewInit,
  Component,
  NgZone,
  inject,
  signal
} from '@angular/core';

import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';

import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { SessionTimerService } from '../../services/session-timer.service';

import { environment } from '../../../environments/environment';

/* =========================
   GOOGLE IDENTITY SERVICES
========================= */

declare const google: any;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements AfterViewInit {

  private router = inject(Router);
  private ngZone = inject(NgZone);

  loading = signal(false);
  googleLoading = signal(false);
  errorMessage = signal('');

  form;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private sessionTimer: SessionTimerService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  /* =========================
     GOOGLE BUTTON
  ========================= */

  ngAfterViewInit(): void {
    this.initializeGoogleLogin();
  }

  private initializeGoogleLogin(): void {

    if (typeof google === 'undefined') {
      console.error(
        '[Google Login] Google Identity Services no está disponible.'
      );

      return;
    }

    const googleButton =
      document.getElementById('google-signin-button');

    if (!googleButton) {
      console.error(
        '[Google Login] No se encontró el contenedor del botón.'
      );

      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,

      callback: (response: { credential: string }) => {

        this.ngZone.run(() => {
          this.handleGoogleCredential(
            response.credential
          );
        });
      },
    });

    google.accounts.id.renderButton(
      googleButton,
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 356,
      }
    );
  }

  /* =========================
     RESPUESTA DE GOOGLE
  ========================= */

  private handleGoogleCredential(
    credential: string
  ): void {

    if (!credential) {
      this.errorMessage.set(
        'Google no proporcionó una credencial válida.'
      );

      return;
    }

    this.googleLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .googleLogin(credential)
      .subscribe({

        next: (response) => {

          this.googleLoading.set(false);

          this.sessionTimer.schedule(
            response.sessionExpiresAt
          );

          this.router.navigateByUrl(
            '/dashboard'
          );
        },

        error: (err) => {

          this.googleLoading.set(false);

          this.errorMessage.set(
            err.error?.message ||
            'No se pudo iniciar sesión con Google. Intenta de nuevo.'
          );
        },
      });
  }

  /* =========================
     FORMULARIO
  ========================= */

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  /* =========================
     LOGIN TRADICIONAL
  ========================= */

  submit(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const {
      email,
      password
    } = this.form.getRawValue();

    this.authService
      .login(
        email!,
        password!
      )
      .subscribe({

        next: (response) => {

          this.loading.set(false);

          this.sessionTimer.schedule(
            response.sessionExpiresAt
          );

          this.router.navigateByUrl(
            '/dashboard'
          );
        },

        error: (err) => {

          this.loading.set(false);

          this.errorMessage.set(
            err.error?.message ||
            'No se pudo iniciar sesión. Intenta de nuevo.'
          );
        },
      });
  }
}
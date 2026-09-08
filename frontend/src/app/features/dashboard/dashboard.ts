import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, MeResponse } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  private authService = inject(AuthService);
  private router = inject(Router);

  user = signal<MeResponse | null>(null);

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (user) => this.user.set(user),
      error: () => this.router.navigateByUrl('/session-expired'),
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
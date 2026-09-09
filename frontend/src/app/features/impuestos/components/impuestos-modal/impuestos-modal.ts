import { Component, EventEmitter, OnInit, Output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ImpuestosService } from '../../../../services/impuestos.service';
import { ResumenImpuestos } from '../../models/impuesto.model';

@Component({
  selector: 'app-impuestos-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './impuestos-modal.html',
  styleUrl: './impuestos-modal.css',
})
export class ImpuestosModal implements OnInit {
  @Output() cerrar = new EventEmitter<void>();

  private impuestosService = inject(ImpuestosService);

  cargando = signal(true);
  error = signal<string | null>(null);
  resumen = signal<ResumenImpuestos | null>(null);

  // Mes que se está consultando, formato "YYYY-MM". Empieza en el mes actual.
  mesSeleccionado = signal<string>(this.formatearMes(new Date()));

  // Texto legible para mostrar en el encabezado, ej. "Septiembre 2026"
  etiquetaMes = computed(() => {
    const [anio, mes] = this.mesSeleccionado().split('-').map(Number);
    const fecha = new Date(anio, mes - 1, 1);
    const nombre = fecha.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' });
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  });

  ngOnInit(): void {
    this.cargarResumen();
  }

  private formatearMes(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${anio}-${mes}`;
  }

  cargarResumen(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.impuestosService.obtenerResumen(this.mesSeleccionado()).subscribe({
      next: (res) => {
        this.resumen.set(res.resumen);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[impuestos] Error al cargar resumen:', err);
        this.error.set('No se pudo cargar la información de impuestos');
        this.cargando.set(false);
      },
    });
  }

  mesAnterior(): void {
    this.cambiarMes(-1);
  }

  mesSiguiente(): void {
    this.cambiarMes(1);
  }

  private cambiarMes(delta: number): void {
    const [anio, mes] = this.mesSeleccionado().split('-').map(Number);
    const fecha = new Date(anio, mes - 1 + delta, 1);
    this.mesSeleccionado.set(this.formatearMes(fecha));
    this.cargarResumen();
  }

  formatoMoneda(valor: number): string {
    return `Q${valor.toFixed(2)}`;
  }

  onCerrar(): void {
    this.cerrar.emit();
  }
}
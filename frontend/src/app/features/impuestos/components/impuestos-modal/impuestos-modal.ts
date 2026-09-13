import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ImpuestosService,
  ResumenImpuestos
} from '../../../../services/impuestos.service';

@Component({
  selector: 'app-impuestos-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './impuestos-modal.html',
  styleUrl: './impuestos-modal.css'
})
export class ImpuestosModal implements OnInit {

  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('selectorMes')
  selectorMes!: ElementRef<HTMLInputElement>;

  mesSeleccionado = '';

  cargando = signal(true);
  error = signal('');
  resumen = signal<ResumenImpuestos | null>(null);

  constructor(
    private impuestosService: ImpuestosService
  ) {}

  ngOnInit(): void {
    const fechaActual = new Date();

    const anio = fechaActual.getFullYear();

    const mes = String(
      fechaActual.getMonth() + 1
    ).padStart(2, '0');

    this.mesSeleccionado = `${anio}-${mes}`;

    this.cargarImpuestos();
  }

  abrirCalendario(): void {
    this.selectorMes.nativeElement.showPicker();
  }

  cargarImpuestos(): void {
    if (!this.mesSeleccionado) {
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    this.impuestosService
      .obtenerResumen(this.mesSeleccionado)
      .subscribe({
        next: (respuesta) => {
          this.resumen.set(respuesta);
          this.cargando.set(false);
        },

        error: (error) => {
          console.error(
            'Error al cargar impuestos:',
            error
          );

          this.error.set(
            'No se pudieron cargar los impuestos.'
          );

          this.cargando.set(false);
        }
      });
  }

  cambiarMes(): void {
    this.cargarImpuestos();
  }

  obtenerMesTexto(): string {
    if (!this.mesSeleccionado) {
      return '';
    }

    const [anio, mes] =
      this.mesSeleccionado.split('-');

    const fecha = new Date(
      Number(anio),
      Number(mes) - 1,
      1
    );

    return new Intl.DateTimeFormat(
      'es-GT',
      {
        month: 'long',
        year: 'numeric'
      }
    ).format(fecha);
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat(
      'es-GT',
      {
        style: 'currency',
        currency: 'GTQ',
        minimumFractionDigits: 2
      }
    ).format(valor);
  }
}
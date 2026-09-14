import {
  Component,
  computed,
  inject,
  output,
  signal
} from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import {
  EstadisticasService,
  PeriodoEstadistica,
  PuntoEstadistica,
  ResultadoEstadisticas
} from '../../../../services/estadisticas.service';

export type TipoVisualizacion =
  | 'ambos'
  | 'ingresos'
  | 'gastos';

@Component({
  selector: 'app-estadisticas-modal',
  standalone: true,
  templateUrl: './estadisticas-modal.html',
  styleUrl: './estadisticas-modal.css'
})
export class EstadisticasModal {
  private estadisticasService =
    inject(EstadisticasService);

  cerrar = output<void>();

  periodo =
    signal<PeriodoEstadistica>('semanal');

  tipoVisualizacion =
    signal<TipoVisualizacion>('ambos');

  estadisticas =
    signal<ResultadoEstadisticas | null>(null);

  cargando = signal(false);

  error =
    signal<string | null>(null);

  fechaActual =
    signal(this.obtenerFechaLocal());

  datos =
    computed<PuntoEstadistica[]>(
      () => this.estadisticas()?.datos ?? []
    );

  maximo =
    computed(() => {
      const valores =
        this.datos().flatMap(
          punto => [
            punto.ingresos,
            punto.gastos
          ]
        );

      const maximo =
        Math.max(...valores, 0);

      return maximo > 0
        ? maximo
        : 1;
    });

  constructor() {
    this.cargar();
  }

  seleccionarPeriodo(
    periodo: PeriodoEstadistica
  ): void {
    if (this.periodo() === periodo) {
      return;
    }

    this.periodo.set(periodo);

    this.cargar();
  }

  seleccionarVisualizacion(
    tipo: TipoVisualizacion
  ): void {
    this.tipoVisualizacion.set(tipo);
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.estadisticasService
      .obtener(
        this.periodo(),
        this.fechaActual()
      )
      .subscribe({
        next: resultado => {
          this.estadisticas.set(resultado);
          this.cargando.set(false);
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[estadisticas-modal] Error:',
            err
          );

          this.error.set(
            'No se pudieron cargar las estadísticas.'
          );

          this.cargando.set(false);
        }
      });
  }

  mostrarIngresos(): boolean {
    return (
      this.tipoVisualizacion() === 'ambos' ||
      this.tipoVisualizacion() === 'ingresos'
    );
  }

  mostrarGastos(): boolean {
    return (
      this.tipoVisualizacion() === 'ambos' ||
      this.tipoVisualizacion() === 'gastos'
    );
  }

  altura(valor: number): number {
    if (valor <= 0) {
      return 0;
    }

    return Math.max(
      (valor / this.maximo()) * 100,
      4
    );
  }

  formatearMoneda(
    valor: number
  ): string {
    return new Intl.NumberFormat(
      'es-GT',
      {
        style: 'currency',
        currency: 'GTQ',
        minimumFractionDigits: 2
      }
    ).format(valor);
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  private obtenerFechaLocal(): string {
    const fecha = new Date();

    const anio =
      fecha.getFullYear();

    const mes =
      String(
        fecha.getMonth() + 1
      ).padStart(2, '0');

    const dia =
      String(
        fecha.getDate()
      ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }
}
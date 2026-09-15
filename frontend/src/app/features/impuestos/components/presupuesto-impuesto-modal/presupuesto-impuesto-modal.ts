import {
  CommonModule
} from '@angular/common';

import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  forkJoin
} from 'rxjs';

import {
  ImpuestosService,
  ResumenImpuestos
} from '../../../../services/impuestos.service';

import {
  PresupuestoImpuestosService
} from '../../../../services/presupuesto-impuestos.service';

import {
  PresupuestoImpuesto
} from '../../models/presupuesto-impuesto.model';

@Component({
  selector: 'app-presupuesto-impuesto-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './presupuesto-impuesto-modal.html',
  styleUrl: './presupuesto-impuesto-modal.css'
})
export class PresupuestoImpuestoModal implements OnInit {

  @Output()
  cerrar =
    new EventEmitter<void>();

  @Output()
  presupuestoActualizado =
    new EventEmitter<void>();

  private fb =
    inject(FormBuilder);

  private presupuestoService =
    inject(PresupuestoImpuestosService);

  private impuestosService =
    inject(ImpuestosService);

  presupuesto =
    signal<PresupuestoImpuesto | null>(null);

  resumen =
    signal<ResumenImpuestos | null>(null);

  cargando =
    signal(true);

  guardando =
    signal(false);

  eliminando =
    signal(false);

  modoEdicion =
    signal(false);

  error =
    signal('');

  exito =
    signal('');

  formulario =
    this.fb.nonNullable.group({
      monto: [
        0,
        [
          Validators.required,
          Validators.min(0.01)
        ]
      ]
    });

  totalImpuestos =
    computed(() =>
      this.resumen()?.totalImpuestos ?? 0
    );

  porcentaje =
    computed(() => {

      const presupuesto =
        this.presupuesto()?.monto ?? 0;

      const total =
        this.totalImpuestos();

      if (presupuesto <= 0) {
        return 0;
      }

      const resultado =
        (total / presupuesto) * 100;

      return Math.min(
        100,
        Math.max(
          0,
          Number(resultado.toFixed(0))
        )
      );
    });

  ngOnInit(): void {
    this.cargarDatos();
  }

  private obtenerMesActual(): string {

    const fecha =
      new Date();

    const anio =
      fecha.getFullYear();

    const mes =
      String(
        fecha.getMonth() + 1
      ).padStart(2, '0');

    return `${anio}-${mes}`;
  }

  cargarDatos(): void {

    this.cargando.set(true);
    this.error.set('');

    forkJoin({
      presupuesto:
        this.presupuestoService.obtener(),

      impuestos:
        this.impuestosService.obtenerResumen(
          this.obtenerMesActual()
        )
    }).subscribe({

      next: ({
        presupuesto,
        impuestos
      }) => {

        this.presupuesto.set(
          presupuesto.presupuesto
        );

        this.resumen.set(
          impuestos
        );

        if (presupuesto.presupuesto) {

          this.formulario.patchValue({
            monto:
              presupuesto.presupuesto.monto
          });

        }

        this.cargando.set(false);
      },

      error: (error) => {

        console.error(
          'Error al cargar presupuesto de impuestos:',
          error
        );

        this.error.set(
          'No se pudo cargar la información.'
        );

        this.cargando.set(false);
      }
    });
  }

  guardar(): void {

    if (
      this.formulario.invalid ||
      this.guardando()
    ) {
      this.formulario.markAllAsTouched();
      return;
    }

    const monto =
      Number(
        this.formulario.controls.monto.value
      );

    this.guardando.set(true);
    this.error.set('');
    this.exito.set('');

    const operacion =
      this.presupuesto()
        ? this.presupuestoService.actualizar({
            monto
          })
        : this.presupuestoService.crear({
            monto
          });

    operacion.subscribe({

      next: (respuesta) => {

        this.presupuesto.set(
          respuesta.presupuesto
        );

        this.formulario.patchValue({
          monto:
            respuesta.presupuesto.monto
        });

        this.modoEdicion.set(false);
        this.guardando.set(false);

        this.exito.set(
          'Presupuesto guardado correctamente.'
        );

        this.presupuestoActualizado.emit();
      },

      error: (error) => {

        console.error(
          'Error al guardar presupuesto:',
          error
        );

        this.error.set(
          error?.error?.message ??
          'No se pudo guardar el presupuesto.'
        );

        this.guardando.set(false);
      }
    });
  }

  editar(): void {

    const presupuesto =
      this.presupuesto();

    if (!presupuesto) {
      return;
    }

    this.error.set('');
    this.exito.set('');

    this.formulario.patchValue({
      monto:
        presupuesto.monto
    });

    this.modoEdicion.set(true);
  }

  cancelarEdicion(): void {

    const presupuesto =
      this.presupuesto();

    if (presupuesto) {

      this.formulario.patchValue({
        monto:
          presupuesto.monto
      });

    }

    this.error.set('');
    this.exito.set('');
    this.modoEdicion.set(false);
  }

  eliminar(): void {

    if (
      !this.presupuesto() ||
      this.eliminando()
    ) {
      return;
    }

    this.eliminando.set(true);
    this.error.set('');
    this.exito.set('');

    this.presupuestoService
      .eliminar()
      .subscribe({

        next: () => {

          this.presupuesto.set(null);

          this.formulario.reset({
            monto: 0
          });

          this.modoEdicion.set(false);
          this.eliminando.set(false);

          this.exito.set(
            'Presupuesto eliminado correctamente.'
          );

          this.presupuestoActualizado.emit();
        },

        error: (error) => {

          console.error(
            'Error al eliminar presupuesto:',
            error
          );

          this.error.set(
            error?.error?.message ??
            'No se pudo eliminar el presupuesto.'
          );

          this.eliminando.set(false);
        }
      });
  }

  cerrarModal(): void {
    this.cerrar.emit();
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
}
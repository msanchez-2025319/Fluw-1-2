import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  finalize
} from 'rxjs';

import {
  GastosPlaneadosService
} from '../../../../services/gastos-planeados.service';

import {
  GastoPlaneado,
  TipoCuotaGastoPlaneado
} from '../../models/gasto-planeado.model';

type ModoModal =
  | 'CREAR'
  | 'VER'
  | 'EDITAR';

@Component({
  selector: 'app-gasto-planeado-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './gasto-planeado-modal.html',
  styleUrl: './gasto-planeado-modal.css'
})
export class GastoPlaneadoModal implements OnInit {

  @Output()
  cerrar =
    new EventEmitter<void>();

  @Output()
  gastoPlaneadoActualizado =
    new EventEmitter<GastoPlaneado | null>();

  private readonly fb =
    inject(FormBuilder);

  private readonly gastosPlaneadosService =
    inject(GastosPlaneadosService);

  readonly cargando =
    signal(true);

  readonly guardando =
    signal(false);

  readonly eliminando =
    signal(false);

  readonly error =
    signal('');

  readonly modo =
    signal<ModoModal>('CREAR');

  readonly gastoPlaneado =
    signal<GastoPlaneado | null>(null);

  readonly formulario =
    this.fb.nonNullable.group({
      monto: [
        0,
        [
          Validators.required,
          Validators.min(0.01)
        ]
      ],

      tipoCuota: [
        'MENSUAL' as TipoCuotaGastoPlaneado,
        Validators.required
      ]
    });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {

    this.cargando.set(true);
    this.error.set('');

    this.gastosPlaneadosService
      .obtener()
      .pipe(
        finalize(() => {
          this.cargando.set(false);
        })
      )
      .subscribe({
        next: (respuesta) => {

          const gasto =
            respuesta.gastoPlaneado;

          this.gastoPlaneado.set(gasto);

          if (gasto) {

            this.modo.set('VER');

            this.formulario.setValue({
              monto: gasto.monto,
              tipoCuota: gasto.tipoCuota
            });

          } else {

            this.modo.set('CREAR');

            this.formulario.reset({
              monto: 0,
              tipoCuota: 'MENSUAL'
            });
          }
        },

        error: (error) => {

          console.error(
            'Error al cargar gasto planeado:',
            error
          );

          this.error.set(
            error?.error?.message ??
            'No se pudo cargar el gasto planeado.'
          );
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

    const tipoCuota =
      this.formulario.controls.tipoCuota.value;

    if (
      !Number.isFinite(monto) ||
      monto <= 0
    ) {
      this.error.set(
        'Ingresa un monto mayor a Q0.00.'
      );

      return;
    }

    this.error.set('');
    this.guardando.set(true);

    const peticion =
      this.modo() === 'CREAR'
        ? this.gastosPlaneadosService.crear({
            monto,
            tipoCuota
          })
        : this.gastosPlaneadosService.actualizar({
            monto,
            tipoCuota
          });

    peticion
      .pipe(
        finalize(() => {
          this.guardando.set(false);
        })
      )
      .subscribe({
        next: (respuesta) => {

          this.gastoPlaneado.set(
            respuesta.gastoPlaneado
          );

          this.formulario.setValue({
            monto:
              respuesta.gastoPlaneado.monto,

            tipoCuota:
              respuesta.gastoPlaneado.tipoCuota
          });

          this.modo.set('VER');

          this.gastoPlaneadoActualizado.emit(
            respuesta.gastoPlaneado
          );
        },

        error: (error) => {

          console.error(
            'Error al guardar gasto planeado:',
            error
          );

          this.error.set(
            error?.error?.message ??
            'No se pudo guardar el gasto planeado.'
          );
        }
      });
  }

  editar(): void {

    const gasto =
      this.gastoPlaneado();

    if (!gasto) {
      return;
    }

    this.error.set('');

    this.formulario.setValue({
      monto: gasto.monto,
      tipoCuota: gasto.tipoCuota
    });

    this.modo.set('EDITAR');
  }

  cancelarEdicion(): void {

    const gasto =
      this.gastoPlaneado();

    if (!gasto) {
      return;
    }

    this.formulario.setValue({
      monto: gasto.monto,
      tipoCuota: gasto.tipoCuota
    });

    this.error.set('');
    this.modo.set('VER');
  }

  eliminar(): void {

    if (this.eliminando()) {
      return;
    }

    this.error.set('');
    this.eliminando.set(true);

    this.gastosPlaneadosService
      .eliminar()
      .pipe(
        finalize(() => {
          this.eliminando.set(false);
        })
      )
      .subscribe({
        next: () => {

          this.gastoPlaneado.set(null);

          this.formulario.reset({
            monto: 0,
            tipoCuota: 'MENSUAL'
          });

          this.modo.set('CREAR');

          this.gastoPlaneadoActualizado.emit(
            null
          );
        },

        error: (error) => {

          console.error(
            'Error al eliminar gasto planeado:',
            error
          );

          this.error.set(
            error?.error?.message ??
            'No se pudo eliminar el gasto planeado.'
          );
        }
      });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  porcentajeVisual(): number {

    const porcentaje =
      Number(
        this.gastoPlaneado()?.porcentaje ?? 0
      );

    return Math.min(
      100,
      Math.max(0, porcentaje)
    );
  }

  porcentajeTexto(): string {

    const porcentaje =
      this.porcentajeVisual();

    return Number.isInteger(porcentaje)
      ? porcentaje.toFixed(0)
      : porcentaje.toFixed(2);
  }

  formatoMoneda(
    valor: number | null | undefined
  ): string {

    const numero =
      Number(valor ?? 0);

    return `Q${numero.toLocaleString(
      'en-US',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )}`;
  }

  nombreCuota(
    tipo: TipoCuotaGastoPlaneado
  ): string {

    switch (tipo) {

      case 'SEMANAL':
        return 'Semanal';

      case 'ANUAL':
        return 'Anual';

      default:
        return 'Mensual';
    }
  }
}
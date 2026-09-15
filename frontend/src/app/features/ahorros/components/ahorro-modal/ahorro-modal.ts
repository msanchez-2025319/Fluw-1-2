import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  inject,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';

import { AhorrosService } from '../../../../services/ahorros.service';

import {
  Ahorro,
  AhorroInput,
  TipoCuota
} from '../../models/ahorro.model';

@Component({
  selector: 'app-ahorro-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './ahorro-modal.html',
  styleUrl: './ahorro-modal.css'
})
export class AhorroModal implements OnInit {

  private fb =
    inject(FormBuilder);

  private ahorrosService =
    inject(AhorrosService);

  @Output()
  cerrar =
    new EventEmitter<void>();

  @Output()
  ahorroActualizado =
    new EventEmitter<Ahorro | null>();

  ahorro =
    signal<Ahorro | null>(null);

  cargando =
    signal(true);

  guardando =
    signal(false);

  eliminando =
    signal(false);

  modoEdicion =
    signal(false);

  error =
    signal<string | null>(null);

  mensaje =
    signal<string | null>(null);

  formulario =
    this.fb.nonNullable.group({
      metaAhorro: [
        0,
        [
          Validators.required,
          Validators.min(0.01)
        ]
      ],

      tipoCuota: [
        'MENSUAL' as TipoCuota,
        [
          Validators.required
        ]
      ],

      montoCuota: [
        0,
        [
          Validators.required,
          Validators.min(0.01)
        ]
      ]
    });

  ngOnInit(): void {
    this.cargarAhorro();
  }

  cargarAhorro(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.ahorrosService
      .obtener()
      .subscribe({
        next: res => {
          this.ahorro.set(
            res.ahorro
          );

          this.modoEdicion.set(false);

          this.cargando.set(false);
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[ahorros] Error al cargar ahorro:',
            err
          );

          this.error.set(
            err.error?.message ??
            'No se pudo cargar la meta de ahorro'
          );

          this.cargando.set(false);
        }
      });
  }

  iniciarEdicion(): void {
    const ahorro =
      this.ahorro();

    if (!ahorro) {
      return;
    }

    this.error.set(null);
    this.mensaje.set(null);

    this.formulario.setValue({
      metaAhorro:
        Number(ahorro.metaAhorro),

      tipoCuota:
        ahorro.tipoCuota,

      montoCuota:
        Number(ahorro.montoCuota)
    });

    this.modoEdicion.set(true);
  }

  cancelarEdicion(): void {
    this.modoEdicion.set(false);

    this.error.set(null);
    this.mensaje.set(null);
  }

  guardar(): void {
    this.error.set(null);
    this.mensaje.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      this.error.set(
        'Completa correctamente todos los campos'
      );

      return;
    }

    const valores =
      this.formulario.getRawValue();

    const input: AhorroInput = {
      metaAhorro:
        Number(valores.metaAhorro),

      tipoCuota:
        valores.tipoCuota,

      montoCuota:
        Number(valores.montoCuota)
    };

    if (
      input.montoCuota >
      input.metaAhorro
    ) {
      this.error.set(
        'El monto de la cuota no puede ser mayor que la meta de ahorro'
      );

      return;
    }

    this.guardando.set(true);

    if (this.ahorro()) {
      this.actualizar(input);
      return;
    }

    this.crear(input);
  }

  private crear(
    input: AhorroInput
  ): void {
    this.ahorrosService
      .crear(input)
      .subscribe({
        next: res => {
          this.ahorro.set(
            res.ahorro
          );

          this.guardando.set(false);

          this.modoEdicion.set(false);

          this.mensaje.set(
            'Meta de ahorro guardada correctamente'
          );

          this.ahorroActualizado.emit(
            res.ahorro
          );
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[ahorros] Error al guardar:',
            err
          );

          this.error.set(
            err.error?.message ??
            'No se pudo guardar la meta de ahorro'
          );

          this.guardando.set(false);
        }
      });
  }

  private actualizar(
    input: AhorroInput
  ): void {
    this.ahorrosService
      .actualizar(input)
      .subscribe({
        next: res => {
          this.ahorro.set(
            res.ahorro
          );

          this.guardando.set(false);

          this.modoEdicion.set(false);

          this.mensaje.set(
            'Meta de ahorro actualizada correctamente'
          );

          this.ahorroActualizado.emit(
            res.ahorro
          );
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[ahorros] Error al actualizar:',
            err
          );

          this.error.set(
            err.error?.message ??
            'No se pudo actualizar la meta de ahorro'
          );

          this.guardando.set(false);
        }
      });
  }

  eliminar(): void {
    const ahorro =
      this.ahorro();

    if (!ahorro) {
      return;
    }

    const confirmar =
      confirm(
        '¿Estás seguro de que deseas eliminar tu meta de ahorro?'
      );

    if (!confirmar) {
      return;
    }

    this.error.set(null);
    this.mensaje.set(null);

    this.eliminando.set(true);

    this.ahorrosService
      .eliminar()
      .subscribe({
        next: () => {
          this.ahorro.set(null);

          this.eliminando.set(false);

          this.modoEdicion.set(false);

          this.formulario.reset({
            metaAhorro: 0,
            tipoCuota: 'MENSUAL',
            montoCuota: 0
          });

          this.mensaje.set(
            'Meta de ahorro eliminada correctamente'
          );

          this.ahorroActualizado.emit(
            null
          );
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[ahorros] Error al eliminar:',
            err
          );

          this.error.set(
            err.error?.message ??
            'No se pudo eliminar la meta de ahorro'
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
    ).format(
      Number(valor) || 0
    );
  }

  obtenerTipoCuotaTexto(
    tipo: TipoCuota
  ): string {
    switch (tipo) {
      case 'SEMANAL':
        return 'Semanal';

      case 'ANUAL':
        return 'Anual';

      case 'MENSUAL':
      default:
        return 'Mensual';
    }
  }
}
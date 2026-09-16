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

import {
  FondoEmergenciaService
} from '../../../../services/fondo-emergencia.service';

import {
  FondoEmergencia,
  TipoCuotaFondo
} from '../../models/fondo-emergencia.model';

@Component({
  selector: 'app-fondo-emergencia-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './fondo-emergencia-modal.html',
  styleUrl: './fondo-emergencia-modal.css'
})
export class FondoEmergenciaModal implements OnInit {

  @Output()
  cerrar =
    new EventEmitter<void>();

  @Output()
  fondoActualizado =
    new EventEmitter<FondoEmergencia | null>();

  private fb =
    inject(FormBuilder);

  private fondoService =
    inject(FondoEmergenciaService);

  fondo =
    signal<FondoEmergencia | null>(null);

  cargando =
    signal(true);

  guardando =
    signal(false);

  eliminando =
    signal(false);

  modoEdicion =
    signal(false);

  mensajeError =
    signal('');

  mensajeExito =
    signal('');

  formulario =
    this.fb.nonNullable.group({
      monto: [
        0,
        [
          Validators.required,
          Validators.min(0.01)
        ]
      ],

      tipoCuota: [
        'MENSUAL' as TipoCuotaFondo,
        [
          Validators.required
        ]
      ]
    });

  ngOnInit(): void {
    this.cargarFondo();
  }

  cargarFondo(): void {

    this.cargando.set(true);
    this.mensajeError.set('');

    this.fondoService
      .obtener()
      .subscribe({

        next: (respuesta) => {

          this.fondo.set(
            respuesta.fondo
          );

          if (respuesta.fondo) {

            this.formulario.patchValue({
              monto:
                respuesta.fondo.monto,

              tipoCuota:
                respuesta.fondo.tipoCuota
            });
          }

          this.cargando.set(false);
        },

        error: (error) => {

          console.error(
            '[FONDO EMERGENCIA] Error al cargar:',
            error
          );

          this.mensajeError.set(
            'No se pudo cargar el fondo de emergencia.'
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

    const valores =
      this.formulario.getRawValue();

    const input = {
      monto:
        Number(valores.monto),

      tipoCuota:
        valores.tipoCuota
    };

    this.guardando.set(true);

    this.mensajeError.set('');
    this.mensajeExito.set('');

    const operacion =
      this.fondo()
        ? this.fondoService
            .actualizar(input)
        : this.fondoService
            .crear(input);

    operacion.subscribe({

      next: (respuesta) => {

        this.fondo.set(
          respuesta.fondo
        );

        this.formulario.patchValue({
          monto:
            respuesta.fondo.monto,

          tipoCuota:
            respuesta.fondo.tipoCuota
        });

        this.modoEdicion.set(false);
        this.guardando.set(false);

        this.mensajeExito.set(
          'Fondo de emergencia guardado correctamente.'
        );

        this.fondoActualizado.emit(
          respuesta.fondo
        );
      },

      error: (error) => {

        console.error(
          '[FONDO EMERGENCIA] Error al guardar:',
          error
        );

        this.mensajeError.set(
          error?.error?.message ??
          'No se pudo guardar el fondo de emergencia.'
        );

        this.guardando.set(false);
      }
    });
  }

  editar(): void {

    const fondo =
      this.fondo();

    if (!fondo) {
      return;
    }

    this.formulario.setValue({
      monto:
        fondo.monto,

      tipoCuota:
        fondo.tipoCuota
    });

    this.mensajeError.set('');
    this.mensajeExito.set('');

    this.modoEdicion.set(true);
  }

  cancelarEdicion(): void {

    const fondo =
      this.fondo();

    if (!fondo) {
      this.cerrarModal();
      return;
    }

    this.formulario.setValue({
      monto:
        fondo.monto,

      tipoCuota:
        fondo.tipoCuota
    });

    this.mensajeError.set('');
    this.mensajeExito.set('');

    this.modoEdicion.set(false);
  }

  eliminar(): void {

    if (
      !this.fondo() ||
      this.eliminando()
    ) {
      return;
    }

    this.eliminando.set(true);

    this.mensajeError.set('');
    this.mensajeExito.set('');

    this.fondoService
      .eliminar()
      .subscribe({

        next: () => {

          this.fondo.set(null);

          this.formulario.reset({
            monto: 0,
            tipoCuota: 'MENSUAL'
          });

          this.eliminando.set(false);
          this.modoEdicion.set(false);

          this.fondoActualizado.emit(
            null
          );

          this.cerrarModal();
        },

        error: (error) => {

          console.error(
            '[FONDO EMERGENCIA] Error al eliminar:',
            error
          );

          this.mensajeError.set(
            error?.error?.message ??
            'No se pudo eliminar el fondo de emergencia.'
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

  textoTipoCuota(
    tipo: TipoCuotaFondo
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
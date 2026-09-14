import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  signal,
  computed,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  Evento,
  EventosService
} from '../../../../services/eventos.service';

@Component({
  selector: 'app-eventos-modal',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './eventos-modal.html',
  styleUrl: './eventos-modal.css'
})
export class EventosModal implements OnInit {

  private eventosService =
    inject(EventosService);

  @Input()
  visible = false;

  @Output()
  cerrar =
    new EventEmitter<void>();

  @Output()
  eventosActualizados =
    new EventEmitter<void>();

  eventos =
    signal<Evento[]>([]);

  cargando =
    signal(false);

  guardando =
    signal(false);

  error =
    signal<string | null>(null);

  modoEdicion =
    signal(false);

  eventoEditandoId =
    signal<string | null>(null);

  fecha = '';

  descripcion = '';

  fechaSeleccionada =
    signal<string | null>(null);

  mesActual =
    signal(new Date());

  nombreMes =
    computed(() => {
      const fecha =
        this.mesActual();

      return fecha.toLocaleDateString(
        'es-GT',
        {
          month: 'long',
          year: 'numeric'
        }
      );
    });

  diasCalendario =
    computed(() => {
      const fecha =
        this.mesActual();

      const anio =
        fecha.getFullYear();

      const mes =
        fecha.getMonth();

      const primerDiaMes =
        new Date(
          anio,
          mes,
          1
        );

      const ultimoDiaMes =
        new Date(
          anio,
          mes + 1,
          0
        );

      const inicioSemana =
        primerDiaMes.getDay();

      const totalDias =
        ultimoDiaMes.getDate();

      const dias: Array<{
        numero: number | null;
        fecha: string | null;
        tieneEvento: boolean;
      }> = [];

      for (
        let i = 0;
        i < inicioSemana;
        i++
      ) {
        dias.push({
          numero: null,
          fecha: null,
          tieneEvento: false
        });
      }

      for (
        let dia = 1;
        dia <= totalDias;
        dia++
      ) {
        const fechaTexto =
          this.crearFechaTexto(
            anio,
            mes,
            dia
          );

        const tieneEvento =
          this.eventos().some(
            evento =>
              this.obtenerFechaEvento(
                evento.fecha
              ) === fechaTexto
          );

        dias.push({
          numero: dia,
          fecha: fechaTexto,
          tieneEvento
        });
      }

      return dias;
    });

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.eventosService
      .obtenerEventos()
      .subscribe({
        next: (
          eventos: Evento[]
        ) => {
          this.eventos.set(
            eventos
          );

          this.cargando.set(
            false
          );
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[eventos-modal] Error al cargar eventos:',
            err
          );

          this.error.set(
            'No se pudieron cargar los eventos'
          );

          this.cargando.set(
            false
          );
        }
      });
  }

  seleccionarFecha(
    fecha: string | null
  ): void {
    if (!fecha) {
      return;
    }

    this.fechaSeleccionada.set(
      fecha
    );

    this.fecha =
      fecha;

    this.modoEdicion.set(
      false
    );

    this.eventoEditandoId.set(
      null
    );

    this.descripcion = '';
  }

  mesAnterior(): void {
    const actual =
      this.mesActual();

    this.mesActual.set(
      new Date(
        actual.getFullYear(),
        actual.getMonth() - 1,
        1
      )
    );
  }

  mesSiguiente(): void {
    const actual =
      this.mesActual();

    this.mesActual.set(
      new Date(
        actual.getFullYear(),
        actual.getMonth() + 1,
        1
      )
    );
  }

  guardarEvento(): void {
    const fechaLimpia =
      this.fecha.trim();

    const descripcionLimpia =
      this.descripcion.trim();

    if (!fechaLimpia) {
      this.error.set(
        'La fecha es obligatoria'
      );
      return;
    }

    if (!descripcionLimpia) {
      this.error.set(
        'La descripción es obligatoria'
      );
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    const id =
      this.eventoEditandoId();

    if (
      this.modoEdicion() &&
      id
    ) {
      this.actualizarEvento(
        id,
        fechaLimpia,
        descripcionLimpia
      );

      return;
    }

    this.eventosService
      .crearEvento({
        fecha: fechaLimpia,
        descripcion:
          descripcionLimpia
      })
      .subscribe({
        next: () => {
          this.guardando.set(
            false
          );

          this.limpiarFormulario();
          this.cargarEventos();

          this.eventosActualizados.emit();
        },

        error: (
          err: HttpErrorResponse
        ) => {
          this.guardando.set(
            false
          );

          this.error.set(
            err.error?.message ??
            'No se pudo guardar el evento'
          );
        }
      });
  }

  editarEvento(
    evento: Evento
  ): void {
    this.modoEdicion.set(
      true
    );

    this.eventoEditandoId.set(
      evento.id
    );

    this.fecha =
      this.obtenerFechaEvento(
        evento.fecha
      );

    this.descripcion =
      evento.descripcion;

    this.fechaSeleccionada.set(
      this.fecha
    );
  }

  actualizarEvento(
    id: string,
    fecha: string,
    descripcion: string
  ): void {
    this.eventosService
      .actualizarEvento(
        id,
        {
          fecha,
          descripcion
        }
      )
      .subscribe({
        next: () => {
          this.guardando.set(
            false
          );

          this.limpiarFormulario();
          this.cargarEventos();

          this.eventosActualizados.emit();
        },

        error: (
          err: HttpErrorResponse
        ) => {
          this.guardando.set(
            false
          );

          this.error.set(
            err.error?.message ??
            'No se pudo actualizar el evento'
          );
        }
      });
  }

  eliminarEvento(
    evento: Evento
  ): void {
    const confirmar =
      confirm(
        `¿Deseas eliminar el evento "${evento.descripcion}"?`
      );

    if (!confirmar) {
      return;
    }

    this.error.set(null);

    this.eventosService
      .eliminarEvento(
        evento.id
      )
      .subscribe({
        next: () => {
          this.limpiarFormulario();
          this.cargarEventos();

          this.eventosActualizados.emit();
        },

        error: (
          err: HttpErrorResponse
        ) => {
          this.error.set(
            err.error?.message ??
            'No se pudo eliminar el evento'
          );
        }
      });
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  cerrarModal(): void {
    this.limpiarFormulario();
    this.cerrar.emit();
  }

  obtenerFechaEvento(
    fecha: string
  ): string {
    return fecha.slice(
      0,
      10
    );
  }

  formatearFecha(
    fecha: string
  ): string {
    const [
      anio,
      mes,
      dia
    ] = this.obtenerFechaEvento(
      fecha
    ).split('-');

    return `${dia}/${mes}/${anio}`;
  }

  private crearFechaTexto(
    anio: number,
    mes: number,
    dia: number
  ): string {
    const mesTexto =
      String(
        mes + 1
      ).padStart(
        2,
        '0'
      );

    const diaTexto =
      String(
        dia
      ).padStart(
        2,
        '0'
      );

    return `${anio}-${mesTexto}-${diaTexto}`;
  }

  private limpiarFormulario(): void {
    this.fecha = '';
    this.descripcion = '';

    this.fechaSeleccionada.set(
      null
    );

    this.modoEdicion.set(
      false
    );

    this.eventoEditandoId.set(
      null
    );

    this.error.set(
      null
    );
  }
}
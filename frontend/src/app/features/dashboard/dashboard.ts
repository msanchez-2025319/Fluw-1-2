import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../services/auth.service';
import { IngresosService } from '../../services/ingresos.service';
import { GastosService } from '../../services/gastos.service';

import {
  EventosService,
  Evento
} from '../../services/eventos.service';

import {
  EstadisticasService,
  PuntoEstadistica,
  ResultadoEstadisticas
} from '../../services/estadisticas.service';

import {
  Ingreso,
  SueldoFijoInput,
  IngresoExtraInput
} from '../ingresos/models/ingreso.model';

import {
  Gasto
} from '../gastos/models/gasto.model';

import {
  SueldoFijoModal
} from '../ingresos/components/sueldo-fijo-modal/sueldo-fijo-modal';

import {
  IngresosMenuModal,
  OpcionIngresoMenu
} from '../ingresos/components/ingresos-menu-modal/ingresos-menu-modal';

import {
  IngresoExtraModal
} from '../ingresos/components/ingreso-extra-modal/ingreso-extra-modal';

import {
  IngresoEditarModal
} from '../ingresos/components/ingreso-editar-modal/ingreso-editar-modal';

import {
  IngresosVistaLista
} from '../ingresos/components/ingresos-vista-lista/ingresos-vista-lista';

import {
  IngresosTablaModal
} from '../ingresos/components/ingresos-tabla-modal/ingresos-tabla-modal';

import {
  CrearGastoModal
} from '../gastos/components/crear-gasto-modal/crear-gasto-modal';

import {
  GastosTablaModal
} from '../gastos/components/gastos-tabla-modal/gastos-tabla-modal';

import {
  GastoEditarModal
} from '../gastos/components/gasto-editar-modal/gasto-editar-modal';

import {
  GastosVistaLista
} from '../gastos/components/gastos-vista-lista/gastos-vista-lista';

import {
  ImpuestosModal
} from '../impuestos/components/impuestos-modal/impuestos-modal';

import {
  EventosModal
} from '../eventos/components/eventos-modal/eventos-modal';

import {
  EstadisticasModal
} from '../estadisticas/components/estadisticas-modal/estadisticas-modal';

@Component({
  selector: 'app-dashboard',
  standalone: true,

  imports: [
    SueldoFijoModal,
    IngresosMenuModal,
    IngresoExtraModal,
    IngresoEditarModal,
    IngresosVistaLista,
    IngresosTablaModal,

    CrearGastoModal,
    GastosTablaModal,
    GastoEditarModal,
    GastosVistaLista,

    ImpuestosModal,
    EventosModal,
    EstadisticasModal
  ],

  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private authService =
    inject(AuthService);

  private ingresosService =
    inject(IngresosService);

  private gastosService =
    inject(GastosService);

  private eventosService =
    inject(EventosService);

  private estadisticasService =
    inject(EstadisticasService);

  private router =
    inject(Router);

  user =
    this.authService.currentUser;

  ingresos =
    signal<Ingreso[]>([]);

  gastos =
    signal<Gasto[]>([]);

  proximosEventos =
    signal<Evento[]>([]);

  estadisticasSemanales =
    signal<ResultadoEstadisticas | null>(
      null
    );

  ultimosIngresos =
    computed(
      () =>
        this.ingresos()
          .slice(0, 5)
    );

  ultimosGastos =
    computed(
      () =>
        this.gastos()
          .slice(0, 5)
    );

  eventosDashboard =
    computed(
      () =>
        this.proximosEventos()
          .slice(0, 5)
    );

  sueldoFijoTexto =
    computed(() => {
      const registro =
        this.ingresos()
          .find(
            ingreso =>
              ingreso.tipo ===
              'SUELDO_FIJO'
          );

      if (!registro) {
        return 'Q0.00';
      }

      return `Q${Number(
        registro.monto
      ).toFixed(2)}`;
    });

  datosGraficaSemanal =
    computed<PuntoEstadistica[]>(
      () =>
        this.estadisticasSemanales()
          ?.datos ?? []
    );

  maximoGraficaSemanal =
    computed(() => {
      const valores =
        this.datosGraficaSemanal()
          .flatMap(
            punto => [
              punto.ingresos,
              punto.gastos
            ]
          );

      const maximo =
        Math.max(
          ...valores,
          0
        );

      return maximo > 0
        ? maximo
        : 1;
    });

  mostrarSueldoFijo =
    signal(false);

  mostrarIngresosMenu =
    signal(false);

  mostrarIngresoExtra =
    signal(false);

  mostrarTablaCompleta =
    signal(false);

  mostrarEditarIngreso =
    signal(false);

  mostrarCrearGasto =
    signal(false);

  mostrarTablaGastos =
    signal(false);

  mostrarEditarGasto =
    signal(false);

  mostrarImpuestos =
    signal(false);

  mostrarEventos =
    signal(false);

  mostrarEstadisticas =
    signal(false);

  cargandoEventos =
    signal(false);

  cargandoEstadisticas =
    signal(false);

  errorEventos =
    signal<string | null>(null);

  errorEstadisticas =
    signal<string | null>(null);

  idParaEditar =
    signal<string | null>(null);

  idGastoEditar =
    signal<number | null>(null);

  tipoIngresoExtra =
    signal<
      'SUELDO_EXTRA' |
      'SUELDO_VARIADO'
    >('SUELDO_EXTRA');

  ngOnInit(): void {
    this.cargarIngresos();
    this.cargarGastos();
    this.cargarProximosEventos();
    this.cargarEstadisticasSemanales();
  }

  cargarIngresos(): void {
    this.ingresosService
      .listar()
      .subscribe({
        next: (
          res: {
            ingresos: Ingreso[]
          }
        ) => {
          this.ingresos.set(
            res.ingresos
          );
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[dashboard] Error al cargar ingresos:',
            err
          );
        }
      });
  }

  abrirSueldoFijo(): void {
    this.mostrarSueldoFijo
      .set(true);
  }

  cerrarSueldoFijo(): void {
    this.mostrarSueldoFijo
      .set(false);
  }

  guardarSueldoFijo(
    input: SueldoFijoInput
  ): void {
    this.ingresosService
      .crear(input)
      .subscribe({
        next: () => {
          this.cargarIngresos();
          this.cargarEstadisticasSemanales();

          this.mostrarSueldoFijo
            .set(false);
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[dashboard] Error al guardar sueldo fijo:',
            err
          );
        }
      });
  }

  abrirIngresosMenu(): void {
    this.mostrarIngresosMenu
      .set(true);
  }

  cerrarIngresosMenu(): void {
    this.mostrarIngresosMenu
      .set(false);
  }

  onSeleccionarTipoExtra(
    opcion: OpcionIngresoMenu
  ): void {
    this.tipoIngresoExtra
      .set(opcion);

    this.mostrarIngresosMenu
      .set(false);

    this.mostrarIngresoExtra
      .set(true);
  }

  cerrarIngresoExtra(): void {
    this.mostrarIngresoExtra
      .set(false);
  }

  guardarIngresoExtra(
    input: IngresoExtraInput
  ): void {
    this.ingresosService
      .crear(input)
      .subscribe({
        next: () => {
          this.cargarIngresos();
          this.cargarEstadisticasSemanales();

          this.mostrarIngresoExtra
            .set(false);
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[dashboard] Error al guardar ingreso extra:',
            err
          );
        }
      });
  }

  abrirTablaCompleta(): void {
    this.mostrarTablaCompleta
      .set(true);
  }

  cerrarTablaCompleta(): void {
    this.mostrarTablaCompleta
      .set(false);
  }

  abrirEditarDesdeTabla(
    id: string
  ): void {
    this.idParaEditar
      .set(id);

    this.mostrarTablaCompleta
      .set(false);

    this.mostrarEditarIngreso
      .set(true);
  }

  abrirEditarManual(): void {
    this.idParaEditar
      .set(null);

    this.mostrarEditarIngreso
      .set(true);
  }

  cerrarEditarIngreso(): void {
    this.mostrarEditarIngreso
      .set(false);

    this.idParaEditar
      .set(null);
  }

  onIngresoActualizado(): void {
    this.cargarIngresos();
    this.cargarEstadisticasSemanales();
    this.cerrarEditarIngreso();
  }

  onIngresoEliminado(): void {
    this.cargarIngresos();
    this.cargarEstadisticasSemanales();
    this.cerrarEditarIngreso();
  }

  cargarGastos(): void {
    this.gastosService
      .listar()
      .subscribe({
        next: (
          res: {
            gastos: Gasto[]
          }
        ) => {
          this.gastos.set(
            res.gastos
          );
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[dashboard] Error al cargar gastos:',
            err
          );
        }
      });
  }

  abrirCrearGasto(): void {
    this.mostrarCrearGasto
      .set(true);
  }

  cerrarCrearGasto(): void {
    this.mostrarCrearGasto
      .set(false);
  }

  guardarGasto(
    gasto: Gasto
  ): void {
    this.gastos.update(
      lista => [
        gasto,
        ...lista
      ]
    );

    this.mostrarCrearGasto
      .set(false);

    this.cargarEstadisticasSemanales();
  }

  abrirTablaGastos(): void {
    this.mostrarTablaGastos
      .set(true);
  }

  cerrarTablaGastos(): void {
    this.mostrarTablaGastos
      .set(false);
  }

  abrirEditarGastoDesdeTabla(
    id: number
  ): void {
    this.idGastoEditar
      .set(id);

    this.mostrarTablaGastos
      .set(false);

    this.mostrarEditarGasto
      .set(true);
  }

  cerrarEditarGasto(): void {
    this.mostrarEditarGasto
      .set(false);

    this.idGastoEditar
      .set(null);
  }

  onGastoActualizado(
    gasto: Gasto
  ): void {
    this.gastos.update(
      lista =>
        lista.map(
          item =>
            item.id === gasto.id
              ? gasto
              : item
        )
    );

    this.cargarEstadisticasSemanales();
    this.cerrarEditarGasto();
  }

  onGastoEliminado(
    id: number
  ): void {
    this.gastos.update(
      lista =>
        lista.filter(
          gasto =>
            gasto.id !== id
        )
    );

    this.cargarEstadisticasSemanales();
    this.cerrarEditarGasto();
  }

  eliminarGastoDesdeLista(
    id: number
  ): void {
    if (
      !confirm(
        '¿Estás seguro de que deseas eliminar este gasto?'
      )
    ) {
      return;
    }

    this.gastosService
      .eliminar(id)
      .subscribe({
        next: () => {
          this.gastos.update(
            lista =>
              lista.filter(
                gasto =>
                  gasto.id !== id
              )
          );

          this.cargarEstadisticasSemanales();
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[dashboard] Error al eliminar gasto:',
            err
          );
        }
      });
  }

  abrirImpuestos(): void {
    this.mostrarImpuestos
      .set(true);
  }

  cerrarImpuestos(): void {
    this.mostrarImpuestos
      .set(false);
  }

  cargarProximosEventos(): void {
    this.cargandoEventos
      .set(true);

    this.errorEventos
      .set(null);

    this.eventosService
      .obtenerProximosEventos()
      .subscribe({
        next: (
          eventos: Evento[]
        ) => {
          this.proximosEventos
            .set(eventos);

          this.cargandoEventos
            .set(false);
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[dashboard] Error al cargar próximos eventos:',
            err
          );

          this.errorEventos.set(
            'No se pudieron cargar los próximos eventos'
          );

          this.cargandoEventos
            .set(false);
        }
      });
  }

  abrirEventos(): void {
    this.mostrarEventos
      .set(true);
  }

  cerrarEventos(): void {
    this.mostrarEventos
      .set(false);
  }

  actualizarEventos(): void {
    this.cargarProximosEventos();
  }

  cargarEstadisticasSemanales(): void {
    this.cargandoEstadisticas
      .set(true);

    this.errorEstadisticas
      .set(null);

    this.estadisticasService
      .obtener(
        'semanal',
        this.obtenerFechaLocal()
      )
      .subscribe({
        next: (
          resultado:
            ResultadoEstadisticas
        ) => {
          this.estadisticasSemanales
            .set(resultado);

          this.cargandoEstadisticas
            .set(false);
        },

        error: (
          err: HttpErrorResponse
        ) => {
          console.error(
            '[dashboard] Error al cargar estadísticas:',
            err
          );

          this.errorEstadisticas
            .set(
              'No se pudo cargar la gráfica'
            );

          this.cargandoEstadisticas
            .set(false);
        }
      });
  }

  alturaGrafica(
    valor: number
  ): number {
    if (valor <= 0) {
      return 0;
    }

    return Math.max(
      (
        valor /
        this.maximoGraficaSemanal()
      ) * 100,
      4
    );
  }

  abrirEstadisticas(): void {
    this.mostrarEstadisticas
      .set(true);
  }

  cerrarEstadisticas(): void {
    this.mostrarEstadisticas
      .set(false);
  }

  formatearMonedaGrafica(
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

  onLogout(): void {
    this.authService
      .logout()
      .subscribe({
        next: () => {
          this.router.navigateByUrl(
            '/login'
          );
        },

        error: () => {
          this.router.navigateByUrl(
            '/login'
          );
        }
      });
  }
}
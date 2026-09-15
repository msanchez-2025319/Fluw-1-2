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
import { AhorrosService } from '../../services/ahorros.service';

import {
  ImpuestosService,
  ResumenImpuestos
} from '../../services/impuestos.service';

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
  Ahorro
} from '../ahorros/models/ahorro.model';

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
  PresupuestoImpuestoModal
} from '../impuestos/components/presupuesto-impuesto-modal/presupuesto-impuesto-modal';

import {
  EventosModal
} from '../eventos/components/eventos-modal/eventos-modal';

import {
  EstadisticasModal
} from '../estadisticas/components/estadisticas-modal/estadisticas-modal';

import {
  AhorroModal
} from '../ahorros/components/ahorro-modal/ahorro-modal';

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
    PresupuestoImpuestoModal,

    EventosModal,
    EstadisticasModal,
    AhorroModal
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

  private ahorrosService =
    inject(AhorrosService);

  private impuestosService =
    inject(ImpuestosService);

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

  ahorro =
    signal<Ahorro | null>(null);

  resumenImpuestos =
    signal<ResumenImpuestos | null>(null);

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

  ahorroActualTexto =
    computed(() => {

      const registro =
        this.ahorro();

      if (!registro) {
        return 'Q0.00';
      }

      return new Intl.NumberFormat(
        'es-GT',
        {
          style: 'currency',
          currency: 'GTQ',
          minimumFractionDigits: 2
        }
      ).format(
        Number(
          registro.ahorroActual
        ) || 0
      );
    });

  porcentajeAhorro =
    computed(() => {

      const porcentaje =
        Number(
          this.ahorro()
            ?.porcentaje ?? 0
        );

      return Math.min(
        100,
        Math.max(
          0,
          porcentaje
        )
      );
    });

  totalImpuestos =
    computed(() =>
      Number(
        this.resumenImpuestos()
          ?.totalImpuestos ?? 0
      )
    );

  totalImpuestosTexto =
    computed(() => {

      return new Intl.NumberFormat(
        'es-GT',
        {
          style: 'currency',
          currency: 'GTQ',
          minimumFractionDigits: 2
        }
      ).format(
        this.totalImpuestos()
      );
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

  mostrarPresupuestoImpuestos =
    signal(false);

  mostrarEventos =
    signal(false);

  mostrarEstadisticas =
    signal(false);

  mostrarAhorro =
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

    this.cargarAhorro();

    this.cargarTotalImpuestos();
  }

  // =========================
  // AHORROS
  // =========================

  cargarAhorro(): void {

    this.ahorrosService
      .obtener()
      .subscribe({

        next: (res) => {

          this.ahorro.set(
            res.ahorro
          );
        },

        error: (
          err: HttpErrorResponse
        ) => {

          console.error(
            '[dashboard] Error al cargar ahorro:',
            err
          );

          this.ahorro.set(null);
        }
      });
  }

  abrirAhorro(): void {

    this.mostrarAhorro
      .set(true);
  }

  cerrarAhorro(): void {

    this.mostrarAhorro
      .set(false);
  }

  onAhorroActualizado(
    ahorro: Ahorro | null
  ): void {

    this.ahorro.set(
      ahorro
    );
  }

  // =========================
  // INGRESOS
  // =========================

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

          this.cargarTotalImpuestos();

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

          this.cargarTotalImpuestos();

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

    this.cargarTotalImpuestos();

    this.cerrarEditarIngreso();
  }

  onIngresoEliminado(): void {

    this.cargarIngresos();

    this.cargarEstadisticasSemanales();

    this.cargarTotalImpuestos();

    this.cerrarEditarIngreso();
  }

  // =========================
  // GASTOS
  // =========================

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

  // =========================
  // IMPUESTOS
  // =========================

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

  cargarTotalImpuestos(): void {

    this.impuestosService
      .obtenerResumen(
        this.obtenerMesActual()
      )
      .subscribe({

        next: (
          resumen: ResumenImpuestos
        ) => {

          this.resumenImpuestos
            .set(resumen);
        },

        error: (
          err: HttpErrorResponse
        ) => {

          console.error(
            '[dashboard] Error al cargar impuestos:',
            err
          );

          this.resumenImpuestos
            .set(null);
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

    this.cargarTotalImpuestos();
  }

  abrirPresupuestoImpuestos(): void {

    this.mostrarPresupuestoImpuestos
      .set(true);
  }

  cerrarPresupuestoImpuestos(): void {

    this.mostrarPresupuestoImpuestos
      .set(false);
  }

  onPresupuestoImpuestosActualizado(): void {

    this.cargarTotalImpuestos();
  }

  // =========================
  // EVENTOS
  // =========================

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

          this.errorEventos
            .set(
              'No se pudieron cargar los eventos'
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

  // =========================
  // ESTADÍSTICAS
  // =========================

  abrirEstadisticas(): void {

    this.mostrarEstadisticas
      .set(true);
  }

  cerrarEstadisticas(): void {

    this.mostrarEstadisticas
      .set(false);
  }

  cargarEstadisticasSemanales(): void {

    this.cargandoEstadisticas
      .set(true);

    this.errorEstadisticas
      .set(null);

    this.estadisticasService
      .obtener('semanal')
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
      5,
      (
        valor /
        this.maximoGraficaSemanal()
      ) * 100
    );
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

  // =========================
  // SESIÓN
  // =========================

  onLogout(): void {

    this.authService
      .logout()
      .subscribe({

        next: () => {

          this.router.navigate(
            ['/login']
          );
        },

        error: () => {

          this.router.navigate(
            ['/login']
          );
        }
      });
  }
}
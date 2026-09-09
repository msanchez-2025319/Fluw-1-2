import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { IngresosService } from '../../services/ingresos.service';
import { GastosService } from '../../services/gastos.service';
import { Ingreso, SueldoFijoInput, IngresoExtraInput } from '../ingresos/models/ingreso.model';
import { Gasto } from '../gastos/models/gasto.model';

import { SueldoFijoModal } from '../ingresos/components/sueldo-fijo-modal/sueldo-fijo-modal';
import { IngresosMenuModal, OpcionIngresoMenu } from '../ingresos/components/ingresos-menu-modal/ingresos-menu-modal';
import { IngresoExtraModal } from '../ingresos/components/ingreso-extra-modal/ingreso-extra-modal';
import { IngresoEditarModal } from '../ingresos/components/ingreso-editar-modal/ingreso-editar-modal';
import { IngresosVistaLista } from '../ingresos/components/ingresos-vista-lista/ingresos-vista-lista';
import { IngresosTablaModal } from '../ingresos/components/ingresos-tabla-modal/ingresos-tabla-modal';

// COMPONENTES DE GASTOS (SIN gastos-menu-modal)
import { CrearGastoModal } from '../gastos/components/crear-gasto-modal/crear-gasto-modal';
import { GastosTablaModal } from '../gastos/components/gastos-tabla-modal/gastos-tabla-modal';
import { GastoEditarModal } from '../gastos/components/gasto-editar-modal/gasto-editar-modal';
import { GastosVistaLista } from '../gastos/components/gastos-vista-lista/gastos-vista-lista';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    // INGRESOS
    SueldoFijoModal,
    IngresosMenuModal,
    IngresoExtraModal,
    IngresoEditarModal,
    IngresosVistaLista,
    IngresosTablaModal,
    // GASTOS (SIN GastosMenuModal)
    CrearGastoModal,
    GastosTablaModal,
    GastoEditarModal,
    GastosVistaLista
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private ingresosService = inject(IngresosService);
  private gastosService = inject(GastosService);
  private router = inject(Router);

  user = this.authService.currentUser;

  // =============================================
  // INGRESOS
  // =============================================
  ingresos = signal<Ingreso[]>([]);
  ultimosIngresos = computed(() => this.ingresos().slice(0, 5));

  sueldoFijoTexto = computed(() => {
    const registro = this.ingresos().find(i => i.tipo === 'SUELDO_FIJO');
    if (!registro) {
      return 'Q0.00';
    }
    return `Q${Number(registro.monto).toFixed(2)}`;
  });

  mostrarSueldoFijo = signal(false);
  mostrarIngresosMenu = signal(false);
  mostrarIngresoExtra = signal(false);
  tipoIngresoExtra = signal<'SUELDO_EXTRA' | 'SUELDO_VARIADO'>('SUELDO_EXTRA');
  mostrarTablaCompleta = signal(false);
  mostrarEditarIngreso = signal(false);
  idParaEditar = signal<string | null>(null);

  // =============================================
  // GASTOS (SIN mostrarGastosMenu)
  // =============================================
  gastos = signal<Gasto[]>([]);
  ultimosGastos = computed(() => this.gastos().slice(0, 5));

  mostrarCrearGasto = signal(false);        // ← Botón "Gastos" del nav abre esto
  mostrarTablaGastos = signal(false);       // ← Botón ⋮ en "Gastos vista" abre esto
  mostrarEditarGasto = signal(false);
  idGastoEditar = signal<number | null>(null);

  // =============================================
  // LIFECYCLE
  // =============================================
  ngOnInit(): void {
    this.cargarIngresos();
    this.cargarGastos();
  }

  // =============================================
  // MÉTODOS: INGRESOS
  // =============================================
  cargarIngresos(): void {
    this.ingresosService.listar().subscribe({
      next: (res: { ingresos: Ingreso[] }) => this.ingresos.set(res.ingresos),
      error: (err: HttpErrorResponse) =>
        console.error('[dashboard] Error al cargar ingresos:', err)
    });
  }

  abrirSueldoFijo(): void {
    this.mostrarSueldoFijo.set(true);
  }

  cerrarSueldoFijo(): void {
    this.mostrarSueldoFijo.set(false);
  }

  guardarSueldoFijo(input: SueldoFijoInput): void {
    this.ingresosService.crear(input).subscribe({
      next: () => {
        this.cargarIngresos();
        this.mostrarSueldoFijo.set(false);
      },
      error: (err: HttpErrorResponse) =>
        console.error('[dashboard] Error al guardar sueldo fijo:', err)
    });
  }

  abrirIngresosMenu(): void {
    this.mostrarIngresosMenu.set(true);
  }

  cerrarIngresosMenu(): void {
    this.mostrarIngresosMenu.set(false);
  }

  onSeleccionarTipoExtra(opcion: OpcionIngresoMenu): void {
    this.tipoIngresoExtra.set(opcion);
    this.mostrarIngresosMenu.set(false);
    this.mostrarIngresoExtra.set(true);
  }

  cerrarIngresoExtra(): void {
    this.mostrarIngresoExtra.set(false);
  }

  guardarIngresoExtra(input: IngresoExtraInput): void {
    this.ingresosService.crear(input).subscribe({
      next: () => {
        this.cargarIngresos();
        this.mostrarIngresoExtra.set(false);
      },
      error: (err: HttpErrorResponse) =>
        console.error('[dashboard] Error al guardar ingreso extra:', err)
    });
  }

  abrirTablaCompleta(): void {
    this.mostrarTablaCompleta.set(true);
  }

  cerrarTablaCompleta(): void {
    this.mostrarTablaCompleta.set(false);
  }

  abrirEditarDesdeTabla(id: string): void {
    this.idParaEditar.set(id);
    this.mostrarTablaCompleta.set(false);
    this.mostrarEditarIngreso.set(true);
  }

  abrirEditarManual(): void {
    this.idParaEditar.set(null);
    this.mostrarEditarIngreso.set(true);
  }

  cerrarEditarIngreso(): void {
    this.mostrarEditarIngreso.set(false);
    this.idParaEditar.set(null);
  }

  onIngresoActualizado(): void {
    this.cargarIngresos();
    this.cerrarEditarIngreso();
  }

  onIngresoEliminado(): void {
    this.cargarIngresos();
    this.cerrarEditarIngreso();
  }

  // =============================================
  // MÉTODOS: GASTOS (SIN menú intermedio)
  // =============================================
  cargarGastos(): void {
    this.gastosService.listar().subscribe({
      next: (res: { gastos: Gasto[] }) => this.gastos.set(res.gastos),
      error: (err: HttpErrorResponse) =>
        console.error('[dashboard] Error al cargar gastos:', err)
    });
  }

  // Botón "Gastos" en el nav → Abre DIRECTAMENTE el modal de creación
  abrirCrearGasto(): void {
    this.mostrarCrearGasto.set(true);
  }

  cerrarCrearGasto(): void {
    this.mostrarCrearGasto.set(false);
  }

  guardarGasto(gasto: Gasto): void {
    this.gastos.update(lista => [gasto, ...lista]);
    this.mostrarCrearGasto.set(false);
  }

  // Botón ⋮ en "Gastos vista" → Abre la tabla completa
  abrirTablaGastos(): void {
    this.mostrarTablaGastos.set(true);
  }

  cerrarTablaGastos(): void {
    this.mostrarTablaGastos.set(false);
  }

  abrirEditarGastoDesdeTabla(id: number): void {
    this.idGastoEditar.set(id);
    this.mostrarTablaGastos.set(false);
    this.mostrarEditarGasto.set(true);
  }

  cerrarEditarGasto(): void {
    this.mostrarEditarGasto.set(false);
    this.idGastoEditar.set(null);
  }

  onGastoActualizado(gasto: Gasto): void {
    this.gastos.update(lista =>
      lista.map(g => g.id === gasto.id ? gasto : g)
    );
    this.cerrarEditarGasto();
  }

  onGastoEliminado(id: number): void {
    this.gastos.update(lista =>
      lista.filter(g => g.id !== id)
    );
    this.cerrarEditarGasto();
  }

  eliminarGastoDesdeLista(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      this.gastosService.eliminar(id).subscribe({
        next: () => {
          this.gastos.update(lista =>
            lista.filter(g => g.id !== id)
          );
        },
        error: (err: HttpErrorResponse) =>
          console.error('[dashboard] Error al eliminar gasto:', err)
      });
    }
  }

  // =============================================
  // LOGOUT
  // =============================================
  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login')
    });
  }
}
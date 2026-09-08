import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DropdownSelect } from '../../../../services/components/dropdown-select/dropdown-select';
import { IngresosService } from '../../../../services/ingresos.service';
import {
  Ingreso, IngresoInput, CategoriaIngreso, MetodoPago, EstadoIngreso, CuentaDestino,
  OPCIONES_CATEGORIA, OPCIONES_METODO_PAGO, OPCIONES_ESTADO, OPCIONES_CUENTA_DESTINO,
} from '../../models/ingreso.model';

@Component({
  selector: 'app-ingreso-editar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSelect],
  templateUrl: './ingreso-editar-modal.html',
  styleUrl: './ingreso-editar-modal.css',
})
export class IngresoEditarModal implements OnInit {
  @Input() ingresoId: string | null = null;

  @Output() cerrar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<Ingreso>();
  @Output() eliminado = new EventEmitter<string>();

  opcionesCategoria = OPCIONES_CATEGORIA;
  opcionesMetodoPago = OPCIONES_METODO_PAGO;
  opcionesEstado = OPCIONES_ESTADO;
  opcionesCuentaDestino = OPCIONES_CUENTA_DESTINO;

  idBusqueda = signal<string>('');
  ingresoCargado = signal<Ingreso | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  errorMensaje = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  confirmandoEliminar = signal(false);

  categoria = signal<CategoriaIngreso | null>(null);
  descripcion = signal<string>('');
  monto = signal<number | null>(null);
  fecha = signal<string>('');
  metodoPago = signal<MetodoPago | null>(null);
  estado = signal<EstadoIngreso | null>(null);
  cuentaDestino = signal<CuentaDestino | null>(null);

  constructor(private ingresosService: IngresosService) {}

  ngOnInit(): void {
    if (this.ingresoId) {
      this.idBusqueda.set(this.ingresoId);
      this.buscar();
    }
  }

  buscar(): void {
    const id = this.idBusqueda().trim();
    if (!id) {
      this.errorMensaje.set('Ingresa un ID de ingreso');
      return;
    }
    this.cargando.set(true);
    this.errorMensaje.set(null);
    this.mensajeExito.set(null);

    this.ingresosService.obtenerPorId(id).subscribe({
      next: ({ ingreso }: { ingreso: Ingreso }) => {
        this.ingresoCargado.set(ingreso);
        this.categoria.set(ingreso.categoria);
        this.descripcion.set(ingreso.descripcion ?? '');
        this.monto.set(Number(ingreso.monto));
        this.fecha.set(ingreso.fecha.substring(0, 10));
        this.metodoPago.set(ingreso.metodoPago);
        this.estado.set(ingreso.estado);
        this.cuentaDestino.set(ingreso.cuentaDestino);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[ingreso-editar-modal] Error al buscar:', err);
        this.errorMensaje.set(err?.error?.message || `No se encontró el ingreso (HTTP ${err.status})`);
        this.ingresoCargado.set(null);
        this.cargando.set(false);
      },
    });
  }

  get esSueldoFijo(): boolean {
    return this.ingresoCargado()?.tipo === 'SUELDO_FIJO';
  }

  onGuardar(): void {
    const actual = this.ingresoCargado();
    if (!actual) {
      this.errorMensaje.set('Primero busca un ingreso por su ID');
      return;
    }

    if (!this.monto() || this.monto()! <= 0) { this.errorMensaje.set('El monto debe ser mayor a 0'); return; }
    if (!this.fecha()) { this.errorMensaje.set('La fecha es obligatoria'); return; }
    if (!this.metodoPago()) { this.errorMensaje.set('Selecciona un método de pago'); return; }
    if (!this.cuentaDestino()) { this.errorMensaje.set('Selecciona una cuenta o destino'); return; }

    let input: IngresoInput;

    if (this.esSueldoFijo) {
      input = {
        tipo: 'SUELDO_FIJO',
        monto: this.monto()!,
        fecha: this.fecha(),
        metodoPago: this.metodoPago()!,
        cuentaDestino: this.cuentaDestino()!,
      };
    } else {
      if (!this.categoria()) { this.errorMensaje.set('Selecciona una categoría'); return; }
      if (!this.descripcion().trim()) { this.errorMensaje.set('La descripción es obligatoria'); return; }
      if (!this.estado()) { this.errorMensaje.set('Selecciona un estado'); return; }

      input = {
        tipo: actual.tipo as 'SUELDO_EXTRA' | 'SUELDO_VARIADO',
        categoria: this.categoria()!,
        descripcion: this.descripcion().trim(),
        monto: this.monto()!,
        fecha: this.fecha(),
        metodoPago: this.metodoPago()!,
        estado: this.estado()!,
        cuentaDestino: this.cuentaDestino()!,
      };
    }

    this.errorMensaje.set(null);
    this.mensajeExito.set(null);
    this.guardando.set(true);

    this.ingresosService.actualizar(actual.id, input).subscribe({
      next: ({ ingreso }: { ingreso: Ingreso; message: string }) => {
        this.guardando.set(false);
        this.mensajeExito.set('Ingreso actualizado correctamente');
        this.actualizado.emit(ingreso);
        setTimeout(() => this.cerrar.emit(), 800);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[ingreso-editar-modal] Error al actualizar:', err);
        this.guardando.set(false);
        this.errorMensaje.set(err?.error?.message || `Error al actualizar (HTTP ${err.status})`);
      },
    });
  }

  onEliminarClick(): void { this.confirmandoEliminar.set(true); }
  onCancelarEliminar(): void { this.confirmandoEliminar.set(false); }

  onConfirmarEliminar(): void {
    const actual = this.ingresoCargado();
    if (!actual) return;

    this.ingresosService.eliminar(actual.id).subscribe({
      next: () => this.eliminado.emit(actual.id),
      error: (err: HttpErrorResponse) => {
        console.error('[ingreso-editar-modal] Error al eliminar:', err);
        this.errorMensaje.set(err?.error?.message || `Error al eliminar (HTTP ${err.status})`);
      },
    });
  }

  onCerrar(): void { this.cerrar.emit(); }
}
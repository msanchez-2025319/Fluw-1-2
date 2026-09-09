import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DropdownSelect } from '../../../../services/components/dropdown-select/dropdown-select';
import { GastosService } from '../../../../services/gastos.service';
import {
  Gasto, GastoInput, FormaPago, EstadoGasto, CategoriaGasto,
  OPCIONES_FORMA_PAGO, OPCIONES_ESTADO_GASTO, OPCIONES_CATEGORIA_GASTO
} from '../../models/gasto.model';

@Component({
  selector: 'app-gasto-editar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSelect],
  templateUrl: './gasto-editar-modal.html',
  styleUrl: './gasto-editar-modal.css'
})
export class GastoEditarModal implements OnInit {
  @Input({ required: true }) gastoId!: number;
  @Output() cerrar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<Gasto>();
  @Output() eliminado = new EventEmitter<number>();

  opcionesFormaPago = OPCIONES_FORMA_PAGO;
  opcionesEstado = OPCIONES_ESTADO_GASTO;
  opcionesCategoria = OPCIONES_CATEGORIA_GASTO;

  gastoCargado = signal<Gasto | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  errorMensaje = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  confirmandoEliminar = signal(false);

  // Campos del formulario
  fecha = signal<string>('');
  descripcion = signal<string>('');
  monto = signal<number | null>(null);
  formaPago = signal<FormaPago | null>(null);
  estado = signal<EstadoGasto | null>(null);
  categoria = signal<CategoriaGasto | null>(null);

  constructor(private gastosService: GastosService) {}

  ngOnInit(): void {
    this.cargarGasto();
  }

  cargarGasto(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);
    this.gastosService.obtenerPorId(this.gastoId).subscribe({
      next: ({ gasto }: { gasto: Gasto }) => {
        this.gastoCargado.set(gasto);
        this.fecha.set(gasto.fecha.substring(0, 10));
        this.descripcion.set(gasto.descripcion);
        this.monto.set(Number(gasto.monto));
        this.formaPago.set(gasto.formaPago);
        this.estado.set(gasto.estado);
        this.categoria.set(gasto.categoria);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[GastoEditarModal] Error al cargar:', err);
        this.errorMensaje.set(err?.error?.message || 'Error al cargar el gasto');
        this.cargando.set(false);
      }
    });
  }

  onGuardar(): void {
    if (!this.gastoCargado()) {
      this.errorMensaje.set('No hay gasto cargado');
      return;
    }

    // Validaciones
    if (!this.fecha()) {
      this.errorMensaje.set('La fecha es obligatoria');
      return;
    }
    if (!this.descripcion().trim()) {
      this.errorMensaje.set('La descripción es obligatoria');
      return;
    }
    if (!this.monto() || this.monto()! <= 0) {
      this.errorMensaje.set('El monto es obligatorio y debe ser mayor a 0');
      return;
    }
    if (!this.formaPago()) {
      this.errorMensaje.set('Selecciona una forma de pago');
      return;
    }
    if (!this.estado()) {
      this.errorMensaje.set('Selecciona un estado');
      return;
    }
    if (!this.categoria()) {
      this.errorMensaje.set('Selecciona una categoría');
      return;
    }

    this.errorMensaje.set(null);
    this.mensajeExito.set(null);
    this.guardando.set(true);

    const input: GastoInput = {
      fecha: this.fecha(),
      descripcion: this.descripcion().trim(),
      monto: this.monto()!,
      formaPago: this.formaPago()!,
      estado: this.estado()!,
      categoria: this.categoria()!
    };

    this.gastosService.actualizar(this.gastoId, input).subscribe({
      next: ({ gasto }: { gasto: Gasto; message: string }) => {
        this.guardando.set(false);
        this.mensajeExito.set('Gasto actualizado correctamente');
        this.actualizado.emit(gasto);
        setTimeout(() => this.cerrar.emit(), 800);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[GastoEditarModal] Error al actualizar:', err);
        this.guardando.set(false);
        this.errorMensaje.set(err?.error?.message || 'Error al actualizar el gasto');
      }
    });
  }

  onEliminarClick(): void {
    this.confirmandoEliminar.set(true);
  }

  onCancelarEliminar(): void {
    this.confirmandoEliminar.set(false);
  }

  onConfirmarEliminar(): void {
    const gasto = this.gastoCargado();
    if (!gasto) return;

    this.gastosService.eliminar(gasto.id).subscribe({
      next: () => {
        this.eliminado.emit(gasto.id);
        this.cerrar.emit();
      },
      error: (err: HttpErrorResponse) => {
        console.error('[GastoEditarModal] Error al eliminar:', err);
        this.errorMensaje.set(err?.error?.message || 'Error al eliminar el gasto');
        this.confirmandoEliminar.set(false);
      }
    });
  }

  onCerrar(): void {
    this.cerrar.emit();
  }
}
import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownSelect } from '../../../../services/components/dropdown-select/dropdown-select';
import { GastosService } from '../../../../services/gastos.service';
import {
  Gasto, GastoInput, FormaPago, EstadoGasto, CategoriaGasto,
  OPCIONES_FORMA_PAGO, OPCIONES_ESTADO_GASTO, OPCIONES_CATEGORIA_GASTO
} from '../../models/gasto.model';

@Component({
  selector: 'app-crear-gasto-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSelect],
  templateUrl: './crear-gasto-modal.html',
  styleUrl: './crear-gasto-modal.css'
})
export class CrearGastoModal {
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<Gasto>();

  opcionesFormaPago = OPCIONES_FORMA_PAGO;
  opcionesEstado = OPCIONES_ESTADO_GASTO;
  opcionesCategoria = OPCIONES_CATEGORIA_GASTO;

  fecha = signal<string>('');
  descripcion = signal<string>('');
  monto = signal<number | null>(null);
  formaPago = signal<FormaPago | null>(null);
  estado = signal<EstadoGasto | null>(null);
  categoria = signal<CategoriaGasto | null>(null);
  errorMensaje = signal<string | null>(null);
  guardando = signal(false);

  constructor(private gastosService: GastosService) {}

  onGuardar(): void {
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
    this.guardando.set(true);

    const input: GastoInput = {
      fecha: this.fecha(),
      descripcion: this.descripcion().trim(),
      monto: this.monto()!,
      formaPago: this.formaPago()!,
      estado: this.estado()!,
      categoria: this.categoria()!
    };

    this.gastosService.crear(input).subscribe({
      next: (response) => {
        this.guardando.set(false);
        this.guardar.emit(response.gasto);
      },
      error: (error) => {
        console.error('[CrearGastoModal] Error:', error);
        this.guardando.set(false);
        this.errorMensaje.set(error?.error?.message || 'Error al guardar el gasto');
      }
    });
  }

  onCerrar(): void {
    this.cerrar.emit();
  }
}
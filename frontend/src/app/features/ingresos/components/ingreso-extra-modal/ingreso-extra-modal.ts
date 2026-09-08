import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownSelect } from '../../../../services/components/dropdown-select/dropdown-select';
import {
  IngresoExtraInput, CategoriaIngreso, MetodoPago, EstadoIngreso, CuentaDestino,
  OPCIONES_CATEGORIA, OPCIONES_METODO_PAGO, OPCIONES_ESTADO, OPCIONES_CUENTA_DESTINO,
} from '../../models/ingreso.model';

@Component({
  selector: 'app-ingreso-extra-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSelect],
  templateUrl: './ingreso-extra-modal.html',
  styleUrl: './ingreso-extra-modal.css',
})
export class IngresoExtraModal {
  @Input({ required: true }) tipo!: 'SUELDO_EXTRA' | 'SUELDO_VARIADO';
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<IngresoExtraInput>();

  opcionesCategoria = OPCIONES_CATEGORIA;
  opcionesMetodoPago = OPCIONES_METODO_PAGO;
  opcionesEstado = OPCIONES_ESTADO;
  opcionesCuentaDestino = OPCIONES_CUENTA_DESTINO;

  categoria = signal<CategoriaIngreso | null>(null);
  descripcion = signal<string>('');
  monto = signal<number | null>(null);
  fecha = signal<string>('');
  metodoPago = signal<MetodoPago | null>(null);
  estado = signal<EstadoIngreso | null>(null);
  cuentaDestino = signal<CuentaDestino | null>(null);
  errorMensaje = signal<string | null>(null);

  get titulo(): string { return this.tipo === 'SUELDO_EXTRA' ? 'Ingreso extra' : 'Ingreso variable'; }

  onGuardar(): void {
    if (!this.categoria()) { this.errorMensaje.set('Selecciona una categoría'); return; }
    if (!this.descripcion().trim()) { this.errorMensaje.set('La descripción es obligatoria'); return; }
    if (!this.monto() || this.monto()! <= 0) { this.errorMensaje.set('El monto es obligatorio y debe ser mayor a 0'); return; }
    if (!this.fecha()) { this.errorMensaje.set('La fecha de ingreso es obligatoria'); return; }
    if (!this.metodoPago()) { this.errorMensaje.set('Selecciona un método de pago'); return; }
    if (!this.estado()) { this.errorMensaje.set('Selecciona un estado'); return; }
    if (!this.cuentaDestino()) { this.errorMensaje.set('Selecciona una cuenta o destino'); return; }
    this.errorMensaje.set(null);
    this.guardar.emit({
      tipo: this.tipo, categoria: this.categoria()!, descripcion: this.descripcion().trim(),
      monto: this.monto()!, fecha: this.fecha(), metodoPago: this.metodoPago()!,
      estado: this.estado()!, cuentaDestino: this.cuentaDestino()!,
    });
  }

  onCerrar(): void { this.cerrar.emit(); }
}

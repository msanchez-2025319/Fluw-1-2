import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownSelect } from '../../../../services/components/dropdown-select/dropdown-select';
import {
  SueldoFijoInput, MetodoPago, CuentaDestino,
  OPCIONES_METODO_PAGO, OPCIONES_CUENTA_DESTINO,
} from '../../models/ingreso.model';

@Component({
  selector: 'app-sueldo-fijo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSelect],
  templateUrl: './sueldo-fijo-modal.html',
  styleUrl: './sueldo-fijo-modal.css',
})
export class SueldoFijoModal {
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<SueldoFijoInput>();

  opcionesMetodoPago = OPCIONES_METODO_PAGO;
  opcionesCuentaDestino = OPCIONES_CUENTA_DESTINO;

  monto = signal<number | null>(null);
  fecha = signal<string>('');
  metodoPago = signal<MetodoPago | null>(null);
  cuentaDestino = signal<CuentaDestino | null>(null);
  errorMensaje = signal<string | null>(null);

  onGuardar(): void {
    if (!this.monto() || this.monto()! <= 0) { this.errorMensaje.set('El monto es obligatorio y debe ser mayor a 0'); return; }
    if (!this.fecha()) { this.errorMensaje.set('La fecha es obligatoria'); return; }
    if (!this.metodoPago()) { this.errorMensaje.set('Selecciona un método de pago'); return; }
    if (!this.cuentaDestino()) { this.errorMensaje.set('Selecciona una cuenta o destino'); return; }
    this.errorMensaje.set(null);
    this.guardar.emit({
      tipo: 'SUELDO_FIJO',
      monto: this.monto()!,
      fecha: this.fecha(),
      metodoPago: this.metodoPago()!,
      cuentaDestino: this.cuentaDestino()!,
    });
  }

  onCerrar(): void { this.cerrar.emit(); }
}

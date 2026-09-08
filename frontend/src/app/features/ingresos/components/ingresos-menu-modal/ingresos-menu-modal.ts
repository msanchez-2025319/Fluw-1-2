import { Component, EventEmitter, Output } from '@angular/core';

export type OpcionIngresoMenu = 'SUELDO_EXTRA' | 'SUELDO_VARIADO';

@Component({
  selector: 'app-ingresos-menu-modal',
  standalone: true,
  templateUrl: './ingresos-menu-modal.html',
  styleUrl: './ingresos-menu-modal.css',
})
export class IngresosMenuModal {
  @Output() cerrar = new EventEmitter<void>();
  @Output() seleccionar = new EventEmitter<OpcionIngresoMenu>();
  onCerrar(): void { this.cerrar.emit(); }
  onSeleccionar(opcion: OpcionIngresoMenu): void { this.seleccionar.emit(opcion); }
}
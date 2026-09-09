import { Component, EventEmitter, Output } from '@angular/core';

export type OpcionGastoMenu = 'CREAR' | 'VER_TABLA';

@Component({
  selector: 'app-gastos-menu-modal',
  standalone: true,
  templateUrl: './gastos-menu-modal.html',
  styleUrl: './gastos-menu-modal.css'
})
export class GastosMenuModal {
  @Output() cerrar = new EventEmitter<void>();
  @Output() seleccionar = new EventEmitter<OpcionGastoMenu>();

  onCerrar(): void {
    this.cerrar.emit();
  }

  onSeleccionar(opcion: OpcionGastoMenu): void {
    this.seleccionar.emit(opcion);
  }
}
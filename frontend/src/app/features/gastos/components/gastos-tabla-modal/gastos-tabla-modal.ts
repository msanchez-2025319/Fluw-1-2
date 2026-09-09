import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Gasto, etiquetaFormaPago, etiquetaEstadoGasto, etiquetaCategoriaGasto } from '../../models/gasto.model';

@Component({
  selector: 'app-gastos-tabla-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gastos-tabla-modal.html',
  styleUrl: './gastos-tabla-modal.css'
})
export class GastosTablaModal {
  @Input() gastos: Gasto[] = [];
  @Output() cerrar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<number>();

  etiquetaFormaPago = etiquetaFormaPago;
  etiquetaEstado = etiquetaEstadoGasto;
  etiquetaCategoria = etiquetaCategoriaGasto;

  fechaFormateada(fecha: string): string {
    const d = new Date(fecha);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  onCerrar(): void {
    this.cerrar.emit();
  }

  onEditar(id: number): void {
    this.editar.emit(id);
  }
}
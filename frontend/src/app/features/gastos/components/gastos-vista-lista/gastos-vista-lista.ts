import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Gasto, etiquetaCategoriaGasto } from '../../models/gasto.model';

@Component({
  selector: 'app-gastos-vista-lista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gastos-vista-lista.html',
  styleUrl: './gastos-vista-lista.css'
})
export class GastosVistaLista {
  @Input() gastos: Gasto[] = [];
  @Output() eliminado = new EventEmitter<number>();

  etiquetaCategoria = etiquetaCategoriaGasto;

  eliminarGasto(id: number): void {
    this.eliminado.emit(id);
  }
}
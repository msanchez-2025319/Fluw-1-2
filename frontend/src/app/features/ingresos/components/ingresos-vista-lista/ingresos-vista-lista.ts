import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ingreso } from '../../models/ingreso.model';

@Component({
  selector: 'app-ingresos-vista-lista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingresos-vista-lista.html',
  styleUrl: './ingresos-vista-lista.css',
})
export class IngresosVistaLista {
  @Input() ingresos: Ingreso[] = [];
  @Output() eliminado = new EventEmitter<string>();

  etiqueta(ingreso: Ingreso): string {
    if (ingreso.tipo === 'SUELDO_FIJO') return 'Sueldo fijo';
    return ingreso.descripcion || 'Ingreso';
  }

  eliminarIngreso(id: string): void {
    this.eliminado.emit(id);
  }
}
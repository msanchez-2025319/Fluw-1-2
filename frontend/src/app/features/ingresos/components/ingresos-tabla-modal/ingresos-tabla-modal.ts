import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ingreso, etiquetaTipo } from '../../models/ingreso.model';

@Component({
  selector: 'app-ingresos-tabla-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingresos-tabla-modal.html',
  styleUrl: './ingresos-tabla-modal.css',
})
export class IngresosTablaModal {
  @Input() ingresos: Ingreso[] = [];

  @Output() cerrar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<string>();

  etiquetaTipo = etiquetaTipo;

  descripcionMostrada(ingreso: Ingreso): string {
    return ingreso.tipo === 'SUELDO_FIJO' ? 'Ingreso fijo' : (ingreso.descripcion || '-');
  }

  fechaFormateada(fecha: string): string {
    const d = new Date(fecha);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  onCerrar(): void { this.cerrar.emit(); }
  onEditar(id: string): void { this.editar.emit(id); }
  editarManual(): void { this.editar.emit(''); }
}
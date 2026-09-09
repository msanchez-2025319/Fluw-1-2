export type FormaPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO';
export type EstadoGasto = 'PAGADO' | 'POR_PAGAR' | 'DEBIENDO_A_OTRO';
export type CategoriaGasto = 'EMPRESA' | 'PERSONAL' | 'TRABAJO' | 'OTRO';

export interface Gasto {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number;
  formaPago: FormaPago;
  estado: EstadoGasto;
  categoria: CategoriaGasto;
  createdAt: string;
  updatedAt: string;
}

export interface GastoInput {
  fecha: string;
  descripcion: string;
  monto: number;
  formaPago: FormaPago;
  estado: EstadoGasto;
  categoria: CategoriaGasto;
}

// Opciones para dropdowns
export const OPCIONES_FORMA_PAGO = [
  { label: 'Efectivo', value: 'EFECTIVO' },
  { label: 'Tarjeta', value: 'TARJETA' },
  { label: 'Transferencia', value: 'TRANSFERENCIA' },
  { label: 'Otro', value: 'OTRO' }
];

export const OPCIONES_ESTADO_GASTO = [
  { label: 'Pagado', value: 'PAGADO' },
  { label: 'Por pagar', value: 'POR_PAGAR' },
  { label: 'Debiendo a otro', value: 'DEBIENDO_A_OTRO' }
];

export const OPCIONES_CATEGORIA_GASTO = [
  { label: 'Empresa', value: 'EMPRESA' },
  { label: 'Personal', value: 'PERSONAL' },
  { label: 'Trabajo', value: 'TRABAJO' },
  { label: 'Otro', value: 'OTRO' }
];

export function etiquetaFormaPago(valor: FormaPago): string {
  const mapa: Record<FormaPago, string> = {
    'EFECTIVO': 'Efectivo',
    'TARJETA': 'Tarjeta',
    'TRANSFERENCIA': 'Transferencia',
    'OTRO': 'Otro'
  };
  return mapa[valor] || valor;
}

export function etiquetaEstadoGasto(valor: EstadoGasto): string {
  const mapa: Record<EstadoGasto, string> = {
    'PAGADO': 'Pagado',
    'POR_PAGAR': 'Por pagar',
    'DEBIENDO_A_OTRO': 'Debiendo a otro'
  };
  return mapa[valor] || valor;
}

export function etiquetaCategoriaGasto(valor: CategoriaGasto): string {
  const mapa: Record<CategoriaGasto, string> = {
    'EMPRESA': 'Empresa',
    'PERSONAL': 'Personal',
    'TRABAJO': 'Trabajo',
    'OTRO': 'Otro'
  };
  return mapa[valor] || valor;
}
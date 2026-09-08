export type TipoIngreso = 'SUELDO_FIJO' | 'SUELDO_EXTRA' | 'SUELDO_VARIADO';
export type CategoriaIngreso = 'SALARIO' | 'SERVICIOS' | 'VENTAS' | 'OTROS_INGRESOS';
export type MetodoPago = 'TARJETA' | 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE';
export type EstadoIngreso = 'PAGADO' | 'PENDIENTE' | 'PARCIAL';
export type CuentaDestino =
  | 'AHORROS' | 'PAGOS' | 'GASTOS_PERSONALES' | 'INVERSIONES'
  | 'CONSUMO_PERSONAL' | 'CUENTAS_BANCARIAS' | 'OTROS';

export interface Ingreso {
  id: string;
  tipo: TipoIngreso;
  categoria: CategoriaIngreso | null;
  descripcion: string | null;
  monto: string;
  fecha: string;
  metodoPago: MetodoPago;
  estado: EstadoIngreso | null;
  cuentaDestino: CuentaDestino;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SueldoFijoInput {
  tipo: 'SUELDO_FIJO';
  monto: number;
  fecha: string;
  metodoPago: MetodoPago;
  cuentaDestino: CuentaDestino;
}

export interface IngresoExtraInput {
  tipo: 'SUELDO_EXTRA' | 'SUELDO_VARIADO';
  categoria: CategoriaIngreso;
  descripcion: string;
  monto: number;
  fecha: string;
  metodoPago: MetodoPago;
  estado: EstadoIngreso;
  cuentaDestino: CuentaDestino;
}

export type IngresoInput = SueldoFijoInput | IngresoExtraInput;

export interface IngresoResponse {
  message: string;
  ingreso: Ingreso;
}

export interface IngresosListResponse {
  ingresos: Ingreso[];
}

export interface FiltroIngresos {
  tipo?: TipoIngreso;
  desde?: string;
  hasta?: string;
}

export const OPCIONES_CATEGORIA: { value: CategoriaIngreso; label: string }[] = [
  { value: 'SALARIO', label: 'Salario' },
  { value: 'SERVICIOS', label: 'Servicios' },
  { value: 'VENTAS', label: 'Ventas' },
  { value: 'OTROS_INGRESOS', label: 'Otros ingresos' },
];

export const OPCIONES_METODO_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
];

export const OPCIONES_ESTADO: { value: EstadoIngreso; label: string }[] = [
  { value: 'PAGADO', label: 'Pagado' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'PARCIAL', label: 'Parcial' },
];

export const OPCIONES_CUENTA_DESTINO: { value: CuentaDestino; label: string }[] = [
  { value: 'AHORROS', label: 'Ahorros' },
  { value: 'PAGOS', label: 'Pagos' },
  { value: 'GASTOS_PERSONALES', label: 'Gastos personales' },
  { value: 'INVERSIONES', label: 'Inversiones' },
  { value: 'CONSUMO_PERSONAL', label: 'Consumo personal' },
  { value: 'CUENTAS_BANCARIAS', label: 'Cuentas bancarias' },
  { value: 'OTROS', label: 'Otros' },
];

export function etiquetaTipo(tipo: TipoIngreso): string {
  if (tipo === 'SUELDO_FIJO') return 'Fijo';
  if (tipo === 'SUELDO_EXTRA') return 'Extra';
  return 'Variable';
}
export type TipoCuotaGastoPlaneado =
  | 'SEMANAL'
  | 'MENSUAL'
  | 'ANUAL';

export interface GastoPlaneado {
  id: string;
  monto: number;
  tipoCuota: TipoCuotaGastoPlaneado;

  totalGastado: number;
  montoDisponible: number;
  porcentaje: number;

  createdAt: string;
  updatedAt: string;
}

export interface GastoPlaneadoResponse {
  gastoPlaneado: GastoPlaneado | null;
}

export interface GastoPlaneadoMutationResponse {
  message: string;
  gastoPlaneado: GastoPlaneado;
}

export interface GastoPlaneadoDeleteResponse {
  message: string;
}

export interface GastoPlaneadoInput {
  monto: number;
  tipoCuota: TipoCuotaGastoPlaneado;
}
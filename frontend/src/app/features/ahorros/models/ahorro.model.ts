export type TipoCuota =
  | 'SEMANAL'
  | 'MENSUAL'
  | 'ANUAL';

export interface Ahorro {
  id: string;
  metaAhorro: number;
  tipoCuota: TipoCuota;
  montoCuota: number;
  ahorroActual: number;
  porcentaje: number;
  createdAt: string;
  updatedAt: string;
}

export interface AhorroInput {
  metaAhorro: number;
  tipoCuota: TipoCuota;
  montoCuota: number;
}

export interface AhorroResponse {
  ahorro: Ahorro | null;
}

export interface AhorroMutationResponse {
  message: string;
  ahorro: Ahorro;
}

export interface AhorroDeleteResponse {
  message: string;
}
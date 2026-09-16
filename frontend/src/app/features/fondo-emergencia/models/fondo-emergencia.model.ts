export type TipoCuotaFondo =
  | 'SEMANAL'
  | 'MENSUAL'
  | 'ANUAL';

export interface FondoEmergencia {
  id: string;
  monto: number;
  tipoCuota: TipoCuotaFondo;
  createdAt: string;
  updatedAt: string;
}

export interface FondoEmergenciaResponse {
  fondo: FondoEmergencia | null;
}

export interface FondoEmergenciaMutationResponse {
  message: string;
  fondo: FondoEmergencia;
}

export interface FondoEmergenciaDeleteResponse {
  message: string;
}

export interface FondoEmergenciaInput {
  monto: number;
  tipoCuota: TipoCuotaFondo;
}
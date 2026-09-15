export interface PresupuestoImpuesto {
  id: string;
  monto: number;
  createdAt: string;
  updatedAt: string;
}

export interface PresupuestoImpuestoResponse {
  presupuesto: PresupuestoImpuesto | null;
}

export interface PresupuestoImpuestoMutationResponse {
  message: string;
  presupuesto: PresupuestoImpuesto;
}

export interface PresupuestoImpuestoDeleteResponse {
  message: string;
}

export interface PresupuestoImpuestoInput {
  monto: number;
}
export interface ResumenCategoriaImpuesto {
  totalIngresos: number;
  totalImpuesto: number;
}

export interface ResumenImpuestos {
  mes: string; // "2026-09"
  ingresosExtra: ResumenCategoriaImpuesto;
  ingresosVariados: ResumenCategoriaImpuesto;
  totalIngresos: number;
  totalImpuestos: number;
}

export interface ImpuestosResponse {
  resumen: ResumenImpuestos;
}
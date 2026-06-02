export type QueryType =
  | 'budget'
  | 'spec'
  | 'budget_spec'
  | 'comparison'
  | 'brand'
  | 'general';

export interface ParsedQuery {
  // Budget
  maxPrice?: number;
  minPrice?: number;

  // Specs
  ram?: number;
  storage?: number;
  battery?: number;
  camera?: number;
  refreshRate?: number;
  network?: string; // 4G | 5G
  nfc?: boolean;

  // Brand
  brand?: string;

  // Type
  queryType: QueryType;

  // Original
  originalQuery: string;
}

export interface IPhoneFilter {
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  ram?: number;
  storage?: number;
  battery?: number;
  camera?: number;
  network?: string; // 4G | 5G
  nfc?: boolean;
  refreshRate?: number;
  os?: string;
  tags?: string[];
}

export interface IPhoneCompare {
  ids: string[];
}

export interface IPhoneSearch {
  keyword: string;
  limit?: number;
}

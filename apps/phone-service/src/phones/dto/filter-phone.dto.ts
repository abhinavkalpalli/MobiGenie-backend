export class FilterPhoneDto {
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  ram?: number;
  storage?: number;
  battery?: number;
  camera?: number;
  network?: string;
  nfc?: boolean;
  refreshRate?: number;
  os?: string;
  tags?: string[];
  page?: number = 1;
  limit?: number = 10;
}

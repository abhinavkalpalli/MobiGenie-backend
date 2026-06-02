import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FilterPhoneDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ram?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  storage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  battery?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  camera?: number;

  @IsOptional()
  @IsString()
  network?: string; // 4G | 5G

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  nfc?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  refreshRate?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

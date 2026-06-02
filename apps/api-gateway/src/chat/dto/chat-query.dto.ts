import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatQueryDto {
  @IsNotEmpty()
  @IsString()
  query!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  title?: string;
}

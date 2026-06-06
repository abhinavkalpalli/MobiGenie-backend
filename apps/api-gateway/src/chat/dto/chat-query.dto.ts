import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ChatQueryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
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

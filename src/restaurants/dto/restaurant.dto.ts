import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRestaurantDto {
  @ApiProperty({ example: 'Burger Palace' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'The best burgers in town' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ example: ['Hamburguesas', 'Comida rápida'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryTags?: string[];

  @ApiPropertyOptional({ example: { mon: { open: '08:00', close: '22:00' } } })
  @IsOptional()
  schedule?: Record<string, { open: string; close: string }>;

  @ApiPropertyOptional({ example: 'Calle 80 #45-10' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 4.6097 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -74.0817 })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ example: 15.0 })
  @IsOptional()
  @IsNumber()
  commissionRate?: number;
}

export class UpdateRestaurantDto extends CreateRestaurantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Casa' })
  @IsNotEmpty()
  @IsString()
  label!: string;

  @ApiProperty({ example: 4.6097 })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: -74.0817 })
  @IsNumber()
  lng!: number;

  @ApiProperty({ example: 'Calle 100 #15-20' })
  @IsNotEmpty()
  @IsString()
  street!: string;

  @ApiPropertyOptional({ example: 'Apto 301, Edificio Torres' })
  @IsOptional()
  @IsString()
  details?: string;
}

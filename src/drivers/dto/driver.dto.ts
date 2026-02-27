import { IsEnum, IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '../../common/enums/vehicle-type.enum';

export class CreateDriverProfileDto {
  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseUrl?: string;
}

export class UpdateDriverProfileDto {
  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}

export class UpdateLocationDto {
  @ApiProperty({ example: 4.6097 })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: -74.0817 })
  @IsNumber()
  lng!: number;
}

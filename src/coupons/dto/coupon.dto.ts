import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsInt,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '../../common/enums/coupon-type.enum';

export class CreateCouponDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsNotEmpty()
  @IsString()
  code!: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  type!: CouponType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  value!: number;

  @ApiPropertyOptional({ example: 20000 })
  @IsOptional()
  @IsNumber()
  minOrder?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  maxUses?: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  maxUses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsNotEmpty()
  @IsString()
  code!: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  orderTotal!: number;
}

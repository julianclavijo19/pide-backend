import { IsEmail, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  to!: string;

  @ApiProperty({ example: 'Welcome to Pide!' })
  @IsString()
  subject!: string;

  @ApiProperty({ example: '<h1>Welcome!</h1><p>Your account has been created.</p>' })
  @IsString()
  html!: string;

  @ApiPropertyOptional({ example: 'Welcome! Your account has been created.' })
  @IsString()
  @IsOptional()
  text?: string;
}

export class OrderConfirmationEmailDto {
  @ApiProperty()
  @IsEmail()
  to!: string;

  @ApiProperty()
  @IsString()
  customerName!: string;

  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsString()
  restaurantName!: string;

  @ApiProperty()
  @IsString()
  total!: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  items?: Record<string, any>[];
}

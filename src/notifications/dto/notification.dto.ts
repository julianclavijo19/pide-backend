import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'Tu pedido está en camino' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'El repartidor ha recogido tu pedido' })
  @IsNotEmpty()
  @IsString()
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  data?: Record<string, any>;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';
import { PaymentMethod } from '../../utils/enums/payment-method';

export class CreateOrderDto {
  @ApiProperty({
    example: '1A',
    description: 'Código de la mesa (único por restaurante)',
  })
  @IsString()
  table_code!: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty({ example: 'CASH', enum: PaymentMethod })
  @IsEnum(PaymentMethod, {
    message: `payment_method must be one of: ${Object.values(PaymentMethod).join(', ')}`,
  })
  payment_method!: PaymentMethod;

  @ApiPropertyOptional({ example: 'Sin cebolla por favor', nullable: true })
  @IsOptional()
  @IsString()
  note?: string | null;
}

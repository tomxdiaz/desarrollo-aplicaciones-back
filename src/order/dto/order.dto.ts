import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { RestaurantOrderStatus } from '../../utils/enums/restaurant-order-status';
import { PaymentMethod } from '../../utils/enums/payment-method';
import { RestaurantDto } from '../../restaurant/dto/restaurant.dto';
import { OrderItemDto } from './order-item.dto';

export class OrderDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  restaurant_id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  table_id!: number;

  @ApiPropertyOptional({ example: 'uuid-here' })
  @IsString()
  user_id!: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  number!: number;

  @ApiProperty({ example: 'PENDING', enum: RestaurantOrderStatus })
  @IsEnum(RestaurantOrderStatus, {
    message: `status must be one of: ${Object.values(RestaurantOrderStatus).join(', ')}`,
  })
  status!: RestaurantOrderStatus;

  @ApiProperty({ example: 'CASH', enum: PaymentMethod })
  @IsEnum(PaymentMethod, {
    message: `payment_method must be one of: ${Object.values(PaymentMethod).join(', ')}`,
  })
  payment_method!: PaymentMethod;

  @ApiProperty({ example: 39.99 })
  @IsNumber()
  total!: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @IsString()
  created_at!: string;

  @ApiPropertyOptional({ type: [OrderItemDto] })
  @IsOptional()
  items?: OrderItemDto[];

  @ApiPropertyOptional({ type: () => RestaurantDto })
  @IsOptional()
  restaurant?: RestaurantDto;

  @ApiPropertyOptional({ example: 'Sin cebolla por favor', nullable: true })
  @IsOptional()
  @IsString()
  note?: string | null;
}

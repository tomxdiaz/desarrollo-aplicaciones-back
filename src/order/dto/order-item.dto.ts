import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  order_id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  product_id!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ example: 19.99 })
  @IsNumber()
  subtotal!: number;
}

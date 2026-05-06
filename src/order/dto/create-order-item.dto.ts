import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  product_id!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  quantity!: number;
}

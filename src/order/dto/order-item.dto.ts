import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  order_id!: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  product_id!: number | null;

  @ApiProperty({ example: 'Cheeseburger' })
  @IsString()
  product_name!: string;

  @ApiPropertyOptional({ example: 'Cheeseburger with fries', nullable: true })
  @IsOptional()
  @IsString()
  product_description!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  product_image!: string | null;

  @ApiProperty({ example: 9.99 })
  @IsNumber()
  unit_price!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ example: 19.98 })
  @IsNumber()
  subtotal!: number;
}

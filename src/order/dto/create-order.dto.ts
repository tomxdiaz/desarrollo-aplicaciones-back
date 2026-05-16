import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ example: 'TBL-42', description: 'Código de la mesa (único por restaurante)' })
  @IsString()
  table_code!: string;


  @ApiProperty({ type: [CreateOrderItemDto] })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty({ example: 'Sin cebolla por favor' })
  @IsOptional()
  @IsString()
  note!: string | null;
}

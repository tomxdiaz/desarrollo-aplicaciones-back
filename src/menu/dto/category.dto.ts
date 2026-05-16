import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ProductDto } from './product.dto';

export class CategoryDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  menu_id!: number;

  @ApiProperty({ example: 'Bebidas' })
  @IsString()
  name!: string;

  @ApiProperty({
    example: true,
    description: 'Indica si la categoría está activa o no',
  })
  active!: boolean;

  @ApiPropertyOptional({ type: () => ProductDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products?: ProductDto[];
}

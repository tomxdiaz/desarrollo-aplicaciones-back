import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 1,
    description: 'ID de la categoría a la que pertenece el producto',
  })
  @IsInt()
  @IsPositive()
  category_id!: number;

  @ApiProperty({
    example: 'Hamburguesa completa',
    description: 'Nombre del producto',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Hamburguesa con queso, lechuga, tomate y papas',
    description: 'Descripción opcional del producto',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 9500.0,
    description: 'Precio del producto',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    example: 'https://example.com/images/hamburguesa.jpg',
    description: 'URL de la imagen del producto',
  })
  @IsOptional()
  @IsString()
  image?: string;
}

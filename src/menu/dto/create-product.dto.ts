import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 1,
    description: 'ID de la categoría a la que pertenece el producto',
  })
  @Type(() => Number)
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
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Archivo de imagen a subir (multipart)',
  })
  @IsOptional()
  image?: unknown;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/images/hamburguesa.jpg',
    description: 'URL de una imagen ya existente que se quiere conservar',
  })
  @IsOptional()
  @IsUrl()
  existingImage?: string;
}

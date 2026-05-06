import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductDto {
  @ApiProperty({
    example: 1,
    description: 'ID del producto',
  })
  id!: number;

  @ApiProperty({
    example: 1,
    description: 'ID de la categoría a la que pertenece el producto',
  })
  category_id!: number;

  @ApiProperty({
    example: 'Hamburguesa completa',
    description: 'Nombre del producto',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'Hamburguesa con queso, lechuga, tomate y papas',
    description: 'Descripción del producto',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: 9500.0,
    description: 'Precio del producto',
  })
  price!: number;

  @ApiPropertyOptional({
    example: 'https://example.com/images/hamburguesa.jpg',
    description: 'URL de la imagen del producto',
    nullable: true,
  })
  image!: string | null;
}

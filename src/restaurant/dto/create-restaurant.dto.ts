import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({ example: 'La Esquina' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Parrilla' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Archivo de imagen a subir (multipart)',
  })
  @IsOptional()
  image?: unknown;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/images/restaurant.jpg',
    description: 'URL de una imagen ya existente que se quiere conservar',
  })
  @IsOptional()
  @IsUrl()
  existingImage?: string;
}

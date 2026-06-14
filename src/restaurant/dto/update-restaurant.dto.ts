import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateRestaurantDto {
  @ApiProperty({ example: 'La Esquina' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Parrilla', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 123', nullable: true })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Archivo de imagen nuevo a subir (multipart)',
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

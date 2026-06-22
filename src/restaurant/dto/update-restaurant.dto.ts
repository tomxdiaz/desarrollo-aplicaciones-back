import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateRestaurantDto {
  @ApiProperty({ example: 'La Esquina' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name!: string;

  @ApiPropertyOptional({ example: 'Parrilla', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 123', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
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

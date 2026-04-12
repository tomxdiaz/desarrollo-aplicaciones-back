import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}

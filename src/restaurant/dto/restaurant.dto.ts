import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TableDto } from '../../table/dto/table.dto';

export class RestaurantDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 'La Esquina' })
  @IsString()
  name!: string;

  @ApiProperty({
    example: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
    format: 'uuid',
  })
  @IsUUID()
  owner_id!: string;

  @ApiPropertyOptional({ example: 'Parrilla', nullable: true })
  @IsOptional()
  @IsString()
  description!: string | null;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 123', nullable: true })
  @IsOptional()
  @IsString()
  address!: string | null;

  @ApiPropertyOptional({ type: () => TableDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TableDto)
  tables?: TableDto[];
}

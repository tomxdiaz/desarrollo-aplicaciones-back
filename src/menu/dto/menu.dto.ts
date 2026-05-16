import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CategoryDto } from './category.dto';
import { Type } from 'class-transformer';

export class MenuDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  restaurant_id!: number;

  @ApiPropertyOptional({ example: 'Menu principal', nullable: true })
  @IsOptional()
  @IsString()
  name!: string | null;

  @ApiPropertyOptional({ type: () => CategoryDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  categories?: CategoryDto[];
}

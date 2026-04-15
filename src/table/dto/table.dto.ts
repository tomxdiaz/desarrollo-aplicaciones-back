import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Constants } from '../../supabase/database.types';
import type { Enums } from '../../supabase/database.types';

export class TableDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  restaurant_id!: number;

  @ApiProperty({ example: '1A' })
  @IsString()
  code!: string;

  @ApiPropertyOptional({ example: 'Main Floor', nullable: true })
  @IsOptional()
  @IsString()
  area!: string | null;

  @ApiProperty({ example: 4 })
  @IsInt()
  @IsPositive()
  capacity!: number;

  @ApiProperty({
    example: 'FREE',
    enum: Constants.public.Enums.restaurant_table_status,
  })
  @IsEnum(Constants.public.Enums.restaurant_table_status)
  status!: Enums<'restaurant_table_status'>;
}

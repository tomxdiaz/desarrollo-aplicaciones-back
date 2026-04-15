import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateTableDto {
  @ApiProperty({ example: '1A' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({ example: 'Main Floor' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @IsPositive()
  capacity!: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTableDto {
  @ApiProperty({ example: '1A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  code!: string;

  @ApiPropertyOptional({ example: 'Main Floor' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  area?: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @IsPositive()
  capacity!: number;
}

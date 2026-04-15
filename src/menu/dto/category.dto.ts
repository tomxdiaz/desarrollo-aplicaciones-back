import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CategoryDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  menu_id!: number;

  @ApiProperty({ example: 'Bebidas' })
  @IsString()
  name!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMenuDto {
  @ApiProperty({ example: 'Menu Cena' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
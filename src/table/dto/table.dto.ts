import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { RestaurantTableStatus } from '../../utils/enums/restaurant-table-status';

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
    enum: RestaurantTableStatus,
  })
  @IsEnum(RestaurantTableStatus, {
    message: `status must be one of: ${Object.values(RestaurantTableStatus).join(', ')}`,
  })
  status!: RestaurantTableStatus;
}

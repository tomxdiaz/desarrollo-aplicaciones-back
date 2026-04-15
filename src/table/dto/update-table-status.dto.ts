import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RestaurantTableStatus } from '../../utils/enums/restaurant-table-status';

export class UpdateTableStatusDto {
  @ApiProperty({
    example: 'FREE',
    enum: RestaurantTableStatus,
  })
  @IsEnum(RestaurantTableStatus, {
    message: `status must be one of: ${Object.values(RestaurantTableStatus).join(', ')}`,
  })
  status!: RestaurantTableStatus;
}

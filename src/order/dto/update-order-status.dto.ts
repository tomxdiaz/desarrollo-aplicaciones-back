import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RestaurantOrderStatus } from '../../utils/enums/restaurant-order-status';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: 'IN_PROCESS',
    enum: RestaurantOrderStatus,
    description: 'Valid transitions: PENDING→IN_PROCESS, PENDING→CANCELLED, IN_PROCESS→DELIVERED',
  })
  @IsEnum(RestaurantOrderStatus, {
    message: `status must be one of: ${Object.values(RestaurantOrderStatus).join(', ')}`,
  })
  status!: RestaurantOrderStatus;
}

import { ApiProperty } from '@nestjs/swagger';
import { RestaurantStaffRole } from '../../utils/enums/restaurant-staff-role';
import { IsEnum, IsInt, IsUUID } from 'class-validator';

export class RestaurantStaffDto {
  @ApiProperty({
    example: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
    format: 'uuid',
  })
  @IsUUID()
  user_id!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  restaurant_id!: number;

  @ApiProperty({
    example: RestaurantStaffRole.ADMIN,
    enum: RestaurantStaffRole,
  })
  @IsEnum(RestaurantStaffRole)
  role!: RestaurantStaffRole;
}

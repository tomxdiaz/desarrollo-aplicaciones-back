import { ApiProperty } from '@nestjs/swagger';
import { RestaurantStaffRole } from '../../utils/enums/restaurant-staff-role';
import { IsEnum, IsInt, IsUUID } from 'class-validator';

export class StaffDto {
  @ApiProperty({
    example: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
    format: 'uuid',
  })
  @IsUUID()
  user_id!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 'ADMIN' })
  @IsEnum(RestaurantStaffRole)
  role!: RestaurantStaffRole;
}

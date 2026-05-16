import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RestaurantStaffRole } from '../../utils/enums/restaurant-staff-role';

export class UpdateStaffRoleDto {
  @ApiProperty({ example: 'CASHIER_PLUS' })
  @IsEnum(RestaurantStaffRole)
  role!: RestaurantStaffRole;
}


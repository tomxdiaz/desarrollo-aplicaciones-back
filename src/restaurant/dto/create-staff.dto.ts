import { RestaurantStaffRole } from '../../utils/enums/restaurant-staff-role';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsEnum(RestaurantStaffRole)
  role: RestaurantStaffRole;
}

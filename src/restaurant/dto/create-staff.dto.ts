import { ApiProperty } from '@nestjs/swagger';
import { RestaurantStaffRole } from '../../utils/enums/restaurant-staff-role';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ADMIN' })
  @IsEnum(RestaurantStaffRole)
  role!: RestaurantStaffRole;
}

import { ApiProperty } from '@nestjs/swagger';
import { RestaurantStaffRole } from '../../utils/enums/restaurant-staff-role';
import { IsEmail, IsEnum, IsInt, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AppRole } from '../../utils/enums/roles';

export class AppUserDto {
  @ApiProperty({ example: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: AppRole.USER, enum: AppRole })
  @IsString()
  global_role!: AppRole;
}

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

  @ApiProperty({ type: AppUserDto })
  @ValidateNested()
  @Type(() => AppUserDto)
  app_user!: AppUserDto;
}

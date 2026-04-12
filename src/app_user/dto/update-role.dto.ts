import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { AppRole } from '../../auth/roles';

export class UpdateGlobalRoleDto {
  @ApiProperty({
    example: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
    format: 'uuid',
  })
  @IsUUID()
  appUserId!: string;

  @ApiProperty({ enum: Object.values(AppRole), example: 'OWNER' })
  @IsEnum(AppRole, { message: 'role must be one of: SUPER_USER, OWNER, USER' })
  role!: string;
}

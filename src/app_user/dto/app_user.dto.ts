import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsUUID } from 'class-validator';
import type { Enums } from '../../supabase/database.types';

type GlobalRole = Enums<'global_role'>;

export class AppUserDto {
  @ApiProperty({
    example: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ['SUPER_USER', 'OWNER', 'USER'], example: 'USER' })
  @IsEnum(['SUPER_USER', 'OWNER', 'USER'])
  global_role!: GlobalRole;
}

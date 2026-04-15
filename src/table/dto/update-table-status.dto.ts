import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Constants } from '../../supabase/database.types';
import type { Enums } from '../../supabase/database.types';

export class UpdateTableStatusDto {
  @ApiProperty({
    example: 'FREE',
    enum: Constants.public.Enums.restaurant_table_status,
  })
  @IsEnum(Constants.public.Enums.restaurant_table_status, {
    message: 'status must be one of: FREE, OCCUPIED',
  })
  status!: Enums<'restaurant_table_status'>;
}

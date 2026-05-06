import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { RestaurantStaffController } from './restaurant_staff.controller';
import { RestaurantStaffService } from './restaurant_staff.service';
import { AppUserService } from '../app_user/app_user.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [RestaurantController, RestaurantStaffController],
  providers: [RestaurantService, RestaurantStaffService, AppUserService],
})
export class RestaurantModule {}

import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [RestaurantController],
  providers: [RestaurantService],
})
export class RestaurantModule {}

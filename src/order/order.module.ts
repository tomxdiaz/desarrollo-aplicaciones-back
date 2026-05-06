import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { OrderService } from './order.service';
import { RestaurantOrderController } from './restaurant_order.controller';
import { UserOrderController } from './user_order.controller';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [UserOrderController, RestaurantOrderController],
  providers: [OrderService],
})
export class OrderModule {}

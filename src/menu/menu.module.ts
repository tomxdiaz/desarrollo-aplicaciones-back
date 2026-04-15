import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}

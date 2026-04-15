import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { TableController } from './table.controller';
import { TableService } from './table.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [TableController],
  providers: [TableService],
})
export class TableModule {}

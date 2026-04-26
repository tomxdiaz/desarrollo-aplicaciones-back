import { Injectable, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { StaffDto } from './dto/staff.dto';

@Injectable()
export class RestaurantStaffService {
  constructor(private readonly supabase: SupabaseService) {}

  async getStaff(restaurantId: number): Promise<StaffDto[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('restaurant_staff')
      .select('*')
      .eq('restaurant_id', restaurantId);
    if (error) throw new ForbiddenException(error.message);
    return data;
  }

  async addStaff(
    restaurantId: number,
    userId: string,
    role: 'ADMIN' | 'CASHIER_PLUS' | 'CASHIER',
  ) {
    // Check if user already exists as staff
    const { data: existing } = await this.supabase
      .getAdminClient()
      .from('restaurant_staff')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) {
      throw new ForbiddenException('User is already staff of this restaurant');
    }

    // Only allow one ADMIN per restaurant
    if (role === 'ADMIN') {
      const { count, error: adminError } = await this.supabase
        .getAdminClient()
        .from('restaurant_staff')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('role', 'ADMIN');
      if (adminError) throw new ForbiddenException(adminError.message);
      if ((count ?? 0) > 0) {
        throw new ForbiddenException(
          'There is already an ADMIN for this restaurant',
        );
      }
    }

    const { error } = await this.supabase
      .getAdminClient()
      .from('restaurant_staff')
      .insert({
        restaurant_id: restaurantId,
        user_id: userId,
        role,
      });
    if (error) throw new ForbiddenException(error.message);
    return { success: true };
  }

  async removeStaff(restaurantId: number, userId: string) {
    const { error } = await this.supabase
      .getAdminClient()
      .from('restaurant_staff')
      .delete()
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId);
    if (error) throw new ForbiddenException(error.message);
    return { success: true };
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type { Tables } from '../../supabase/database.types';
type AppUser = Tables<'app_user'>;
type AuthenticatedRequest = Request & { appUser?: AppUser };
import { SupabaseService } from '../../supabase/supabase.service';
import {
  RESTAURANT_ROLES_KEY,
  RestaurantStaffRole,
} from '../decorators/restaurant-roles.decorator';
import { AppRole } from '../../utils/enums/roles';

@Injectable()
export class RestaurantRolesGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const appUser = request.appUser;
    const idParam = request.params.restaurantId;

    // Allow SUPER_USER to bypass all checks
    if (appUser && appUser.global_role === AppRole.SUPER_USER) {
      return true;
    }

    const restaurantId = Array.isArray(idParam)
      ? parseInt(idParam[0], 10)
      : parseInt(idParam, 10);
    if (!appUser || !restaurantId) {
      throw new ForbiddenException('Missing user or restaurant id');
    }

    // Get allowed staff roles from metadata (can be empty)
    const allowedRoles =
      this.reflector.getAllAndOverride<RestaurantStaffRole[]>(
        RESTAURANT_ROLES_KEY,
        [context.getHandler(), context.getClass()],
      ) || [];

    // Check if user is the owner
    const { data: restaurant, error: restaurantError } = await this.supabase
      .getAdminClient()
      .from('restaurant')
      .select('owner_id')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      throw new ForbiddenException('Restaurant not found');
    }

    if (restaurant.owner_id === appUser.id) {
      return true;
    }

    // If no allowed staff roles, only owner is allowed
    if (allowedRoles.length === 0) {
      throw new ForbiddenException(
        'You are not allowed to manage this restaurant',
      );
    }

    // Check if user is staff of the restaurant with allowed role
    const { data: staff, error: staffError } = await this.supabase
      .getAdminClient()
      .from('restaurant_staff')
      .select('role')
      .eq('restaurant_id', restaurantId)
      .eq('user_id', appUser.id)
      .maybeSingle();
    if (staffError) {
      throw new ForbiddenException('Error checking staff');
    }
    if (staff && allowedRoles.includes(staff.role)) {
      return true;
    }
    throw new ForbiddenException(
      'You are not allowed to manage this restaurant',
    );
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type { Tables } from '../../supabase/database.types';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  RESTAURANT_ROLES_KEY,
  RestaurantStaffRole,
} from '../decorators/restaurant-roles.decorator';
import { AppRole } from '../../utils/enums/roles';

type AppUser = Tables<'app_user'>;
type AuthenticatedRequest = Request & { appUser?: AppUser };

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

    const restaurantId = Array.isArray(idParam)
      ? parseInt(idParam[0], 10)
      : parseInt(idParam, 10);

    if (!appUser || !restaurantId) {
      throw new ForbiddenException('Falta el usuario o el ID del restaurante');
    }

    const allowedRoles =
      this.reflector.getAllAndOverride<RestaurantStaffRole[]>(
        RESTAURANT_ROLES_KEY,
        [context.getHandler(), context.getClass()],
      ) || [];

    const { data: restaurant, error: restaurantError } = await this.supabase
      .getAdminClient()
      .from('restaurant')
      .select('owner_id')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restaurantError) {
      throw new InternalServerErrorException(
        'Error inesperado al validar el restaurante',
      );
    }

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    // SUPER_USER omite solo la validación de rol,
    // pero NO la existencia del restaurante.
    if (appUser.global_role === AppRole.SUPER_USER) {
      return true;
    }

    if (restaurant.owner_id === appUser.id) {
      return true;
    }

    if (allowedRoles.length === 0) {
      throw new ForbiddenException(
        'No tenés permisos para gestionar este restaurante',
      );
    }

    const { data: staff, error: staffError } = await this.supabase
      .getAdminClient()
      .from('restaurant_staff')
      .select('role')
      .eq('restaurant_id', restaurantId)
      .eq('user_id', appUser.id)
      .maybeSingle();

    if (staffError) {
      throw new InternalServerErrorException(
        'Error inesperado al validar el rol del usuario en el restaurante',
      );
    }

    if (staff && allowedRoles.includes(staff.role)) {
      return true;
    }

    throw new ForbiddenException(
      'No tenés permisos para gestionar este restaurante',
    );
  }
}

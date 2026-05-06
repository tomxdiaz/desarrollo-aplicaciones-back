import { SetMetadata } from '@nestjs/common';
import type { Enums } from '../../supabase/database.types';

export const RESTAURANT_ROLES_KEY = 'restaurant_roles';
export type RestaurantStaffRole = Enums<'restaurant_staff_role'>;

export const RestaurantRoles = (...roles: RestaurantStaffRole[]) =>
  SetMetadata(RESTAURANT_ROLES_KEY, roles);

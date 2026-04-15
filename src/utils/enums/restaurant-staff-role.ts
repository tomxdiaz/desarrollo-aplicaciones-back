import type { Enums } from '../../supabase/database.types';

export const RestaurantStaffRole = {
  ADMIN: 'ADMIN',
  CASHIER_PLUS: 'CASHIER_PLUS',
  CASHIER: 'CASHIER',
} as const;

export type RestaurantStaffRole = Enums<'restaurant_staff_role'>;

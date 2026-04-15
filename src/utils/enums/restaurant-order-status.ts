import type { Enums } from '../../supabase/database.types';

export const RestaurantOrderStatus = {
  PENDING: 'PENDING',
  IN_PROCESS: 'IN_PROCESS',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type RestaurantOrderStatus = Enums<'restaurant_order_status'>;

import type { Enums } from '../../supabase/database.types';

export const RestaurantTableStatus = {
  FREE: 'FREE',
  OCCUPIED: 'OCCUPIED',
} as const;

export type RestaurantTableStatus = Enums<'restaurant_table_status'>;

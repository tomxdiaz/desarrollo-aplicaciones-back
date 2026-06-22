import type { Enums } from '../../supabase/database.types';

export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  WALLET: 'WALLET',
} as const;

export type PaymentMethod = Enums<'payment_method'>;

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { StaffDto } from './dto/staff.dto';

@Injectable()
export class RestaurantStaffService {
  private readonly logger = new Logger(RestaurantStaffService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async getStaff(restaurantId: number): Promise<StaffDto[]> {
    const client = this.supabase.getAdminClient();

    await this.ensureRestaurantExists(restaurantId);

    const { data, error } = await client
      .from('restaurant_staff')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(
        `Error finding staff for restaurant_id ${restaurantId}: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener el personal del restaurante',
      );
    }

    return data ?? [];
  }

  async addStaff(
    restaurantId: number,
    userId: string,
    role: 'ADMIN' | 'CASHIER_PLUS' | 'CASHIER',
  ) {
    const client = this.supabase.getAdminClient();

    await this.ensureRestaurantExists(restaurantId);

    const { data: existing, error: existingError } = await client
      .from('restaurant_staff')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      this.logger.error(
        `Error checking existing staff for restaurant_id ${restaurantId}, user_id ${userId}: ${existingError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al validar el personal del restaurante',
      );
    }

    if (existing) {
      throw new BadRequestException(
        'El usuario ya es parte del personal de este restaurante',
      );
    }

    if (role === 'ADMIN') {
      const { count, error: adminError } = await client
        .from('restaurant_staff')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('role', 'ADMIN');

      if (adminError) {
        this.logger.error(
          `Error checking admin staff for restaurant_id ${restaurantId}: ${adminError.message}`,
        );

        throw new InternalServerErrorException(
          'Error inesperado al validar administradores del restaurante',
        );
      }

      if ((count ?? 0) > 0) {
        throw new BadRequestException(
          'Ya existe un ADMIN para este restaurante',
        );
      }
    }

    const { error } = await client.from('restaurant_staff').insert({
      restaurant_id: restaurantId,
      user_id: userId,
      role,
    });

    if (error) {
      this.logger.error(
        `Error adding staff to restaurant_id ${restaurantId}: ${error.message}`,
      );

      if (this.isForeignKeyViolation(error)) {
        throw new NotFoundException('Restaurante o usuario no encontrado');
      }

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException('Datos inválidos para agregar personal');
      }

      throw new InternalServerErrorException(
        'Error inesperado al agregar personal',
      );
    }

    return { success: true };
  }

  async removeStaff(restaurantId: number, userId: string) {
    const client = this.supabase.getAdminClient();

    await this.ensureRestaurantExists(restaurantId);

    const { data: existing, error: existingError } = await client
      .from('restaurant_staff')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      this.logger.error(
        `Error checking staff before delete for restaurant_id ${restaurantId}, user_id ${userId}: ${existingError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al validar el personal del restaurante',
      );
    }

    if (!existing) {
      throw new NotFoundException(
        'El usuario no pertenece al personal de este restaurante',
      );
    }

    const { error } = await client
      .from('restaurant_staff')
      .delete()
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(
        `Error removing staff from restaurant_id ${restaurantId}, user_id ${userId}: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al eliminar personal',
      );
    }

    return { success: true };
  }

  private async ensureRestaurantExists(restaurantId: number): Promise<void> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('restaurant')
      .select('id')
      .eq('id', restaurantId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Error finding restaurant_id ${restaurantId}: ${error.message}`,
      );

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException('restaurantId inválido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al obtener el restaurante',
      );
    }

    if (!data) {
      throw new NotFoundException('Restaurante no encontrado');
    }
  }

  private isForeignKeyViolation(error: { code?: string }): boolean {
    return error.code === '23503';
  }

  private isBadRequestDatabaseError(error: {
    code?: string;
    message?: string;
  }): boolean {
    const message = error.message?.toLowerCase() ?? '';

    return (
      error.code === '22P02' || // invalid_text_representation
      error.code === '23502' || // not_null_violation
      error.code === '23505' || // unique_violation
      error.code === '23514' || // check_violation
      message.includes('invalid input syntax')
    );
  }
}

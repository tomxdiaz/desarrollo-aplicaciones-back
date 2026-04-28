import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Tables, Enums } from '../supabase/database.types';
import { CreateTableDto } from './dto/create-table.dto';
import { TableDto } from './dto/table.dto';

type RestaurantTable = Tables<'restaurant_table'>;

@Injectable()
export class TableService {
  private readonly logger = new Logger(TableService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAllByRestaurant(restaurantId: number): Promise<TableDto[]> {
    const supabase = this.supabaseService.getClient();

    await this.ensureRestaurantExists(restaurantId);

    const { data, error } = await supabase
      .from('restaurant_table')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(
        `Error finding tables for restaurant_id ${restaurantId}: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener las mesas',
      );
    }

    return (data ?? []).map((table) => this.toTableDto(table));
  }

  async create(
    restaurantId: number,
    createTableDto: CreateTableDto,
  ): Promise<TableDto> {
    const supabase = this.supabaseService.getAdminClient();

    await this.ensureRestaurantExists(restaurantId);

    const { data, error } = await supabase
      .from('restaurant_table')
      .insert({
        restaurant_id: restaurantId,
        code: createTableDto.code,
        area: createTableDto.area ?? null,
        capacity: createTableDto.capacity,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Error creating table for restaurant_id ${restaurantId}: ${error.message}`,
      );

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException('Datos inválidos para crear la mesa');
      }

      throw new InternalServerErrorException(
        'Error inesperado al crear la mesa',
      );
    }

    return this.toTableDto(data);
  }

  async delete(restaurantId: number, tableId: number): Promise<TableDto> {
    const supabase = this.supabaseService.getAdminClient();

    await this.ensureRestaurantExists(restaurantId);

    const { data: existing, error: findError } = await supabase
      .from('restaurant_table')
      .select('*')
      .eq('id', tableId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (findError) {
      this.logger.error(
        `Error finding table_id ${tableId} for restaurant_id ${restaurantId}: ${findError.message}`,
      );

      if (this.isBadRequestDatabaseError(findError)) {
        throw new BadRequestException('tableId inválido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al obtener la mesa',
      );
    }

    if (!existing) {
      throw new NotFoundException('Mesa no encontrada');
    }

    const { error } = await supabase
      .from('restaurant_table')
      .delete()
      .eq('id', tableId);

    if (error) {
      this.logger.error(`Error deleting table_id ${tableId}: ${error.message}`);

      throw new InternalServerErrorException(
        'Error inesperado al eliminar la mesa',
      );
    }

    return this.toTableDto(existing);
  }

  async updateStatus(
    restaurantId: number,
    tableId: number,
    status: Enums<'restaurant_table_status'>,
  ): Promise<TableDto> {
    const supabase = this.supabaseService.getAdminClient();

    await this.ensureRestaurantExists(restaurantId);

    const { data, error } = await supabase
      .from('restaurant_table')
      .update({ status })
      .eq('id', tableId)
      .eq('restaurant_id', restaurantId)
      .select()
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Error updating status for table_id ${tableId} in restaurant_id ${restaurantId}: ${error.message}`,
      );

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException(
          'Datos inválidos para actualizar la mesa',
        );
      }

      throw new InternalServerErrorException(
        'Error inesperado al actualizar la mesa',
      );
    }

    if (!data) {
      throw new NotFoundException('Mesa no encontrada');
    }

    return this.toTableDto(data);
  }

  private async ensureRestaurantExists(restaurantId: number): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
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

  private toTableDto(table: RestaurantTable): TableDto {
    return {
      id: table.id,
      restaurant_id: table.restaurant_id,
      code: table.code,
      area: table.area,
      capacity: table.capacity,
      status: table.status,
    };
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

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tables, Enums } from '../supabase/database.types';
import { CreateTableDto } from './dto/create-table.dto';
import { TableDto } from './dto/table.dto';

type RestaurantTable = Tables<'restaurant_table'>;

@Injectable()
export class TableService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAllByRestaurant(restaurantId: number): Promise<TableDto[]> {
    const supabase = this.supabaseService.getClient();

    await this.assertRestaurantExists(supabase, restaurantId);

    const { data, error } = await supabase
      .from('restaurant_table')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []).map((table) => this.toTableDto(table));
  }

  async create(
    restaurantId: number,
    createTableDto: CreateTableDto,
  ): Promise<TableDto> {
    const supabase = this.supabaseService.getAdminClient();

    await this.assertRestaurantExists(supabase, restaurantId);

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
      throw new InternalServerErrorException(error.message);
    }

    return this.toTableDto(data);
  }

  async delete(restaurantId: number, tableId: number): Promise<TableDto> {
    const supabase = this.supabaseService.getAdminClient();

    await this.assertRestaurantExists(supabase, restaurantId);

    const { data: existing, error: findError } = await supabase
      .from('restaurant_table')
      .select('*')
      .eq('id', tableId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (findError) {
      throw new InternalServerErrorException(findError.message);
    }

    if (!existing) {
      throw new NotFoundException(
        `Table with id ${tableId} not found in restaurant ${restaurantId}`,
      );
    }

    const { error } = await supabase
      .from('restaurant_table')
      .delete()
      .eq('id', tableId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return this.toTableDto(existing);
  }

  async updateStatus(
    restaurantId: number,
    tableId: number,
    status: Enums<'restaurant_table_status'>,
  ): Promise<TableDto> {
    const supabase = this.supabaseService.getAdminClient();

    await this.assertRestaurantExists(supabase, restaurantId);

    const { data, error } = await supabase
      .from('restaurant_table')
      .update({ status })
      .eq('id', tableId)
      .eq('restaurant_id', restaurantId)
      .select()
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(
        `Table with id ${tableId} not found in restaurant ${restaurantId}`,
      );
    }

    return this.toTableDto(data);
  }

  private async assertRestaurantExists(
    supabase: SupabaseClient,
    restaurantId: number,
  ): Promise<void> {
    const { data, error } = await supabase
      .from('restaurant')
      .select('id')
      .eq('id', restaurantId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(
        `Restaurant with id ${restaurantId} not found`,
      );
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
}

import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Tables } from '../supabase/database.types';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { RestaurantDto } from './dto/restaurant.dto';
import { TableDto } from '../table/dto/table.dto';

type Restaurant = Tables<'restaurant'>;

@Injectable()
export class RestaurantService {
  private readonly logger = new Logger(RestaurantService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(): Promise<RestaurantDto[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('restaurant')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(`Error finding all restaurants: ${error.message}`);

      throw new InternalServerErrorException(
        'Error inesperado al obtener los restaurantes',
      );
    }

    return (data ?? []).map((restaurant) => this.toRestaurantDto(restaurant));
  }

  async create(
    createRestaurantDto: CreateRestaurantDto,
    ownerId: string,
  ): Promise<RestaurantDto> {
    const supabase = this.supabaseService.getAdminClient();

    if (!createRestaurantDto.name) {
      throw new BadRequestException('El nombre del restaurante es requerido');
    }

    const { data: owner, error: ownerError } = await supabase
      .from('app_user')
      .select('id')
      .eq('id', ownerId)
      .maybeSingle();

    if (ownerError) {
      this.logger.error(
        `Error finding owner_id ${ownerId}: ${ownerError.message}`,
      );

      if (this.isBadRequestDatabaseError(ownerError)) {
        throw new BadRequestException(
          'Datos inválidos para crear el restaurante',
        );
      }

      throw new InternalServerErrorException(
        'Error inesperado al validar el dueño del restaurante',
      );
    }

    if (!owner) {
      throw new BadRequestException(
        'El usuario dueño del restaurante no existe',
      );
    }

    const { data, error } = await supabase
      .from('restaurant')
      .insert({
        name: createRestaurantDto.name,
        owner_id: ownerId,
        description: createRestaurantDto.description ?? null,
        address: createRestaurantDto.address ?? null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error creating restaurant: ${error.message}`);

      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException(
          'El usuario dueño del restaurante no existe',
        );
      }

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException(
          'Datos inválidos para crear el restaurante',
        );
      }

      throw new InternalServerErrorException(
        'Error inesperado al crear el restaurante',
      );
    }

    return this.toRestaurantDto(data);
  }

  async findOne(id: number): Promise<RestaurantDto> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('restaurant')
      .select('*, restaurant_table(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding restaurant_id ${id}: ${error.message}`);

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

    const tables: TableDto[] = (data.restaurant_table ?? []).map((table) => ({
      id: table.id,
      restaurant_id: table.restaurant_id,
      code: table.code,
      area: table.area,
      capacity: table.capacity,
      status: table.status,
    }));

    return {
      ...this.toRestaurantDto(data),
      tables,
    };
  }

  /**
   * Restaurants linked to the user as owner (`owner_id`) or as staff (`restaurant_staff`).
   * Owner is not modeled as staff; lists are concatenated without deduplication.
   */
  async findMyRestaurants(userId: string): Promise<RestaurantDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const [
      { data: owned, error: ownedError },
      { data: staffRows, error: staffError },
    ] = await Promise.all([
      supabase.from('restaurant').select('*').eq('owner_id', userId),
      supabase
        .from('restaurant_staff')
        .select('restaurant_id')
        .eq('user_id', userId),
    ]);

    if (ownedError) {
      this.logger.error(
        `Error finding owned restaurants for user_id ${userId}: ${ownedError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener los restaurantes del usuario',
      );
    }

    if (staffError) {
      this.logger.error(
        `Error finding staff restaurants for user_id ${userId}: ${staffError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener los restaurantes del usuario',
      );
    }

    const staffIds = (staffRows ?? []).map((row) => row.restaurant_id);

    let staffRestaurants: Restaurant[] = [];

    if (staffIds.length > 0) {
      const { data, error } = await supabase
        .from('restaurant')
        .select('*')
        .in('id', staffIds);

      if (error) {
        this.logger.error(
          `Error finding restaurants by staff ids for user_id ${userId}: ${error.message}`,
        );

        throw new InternalServerErrorException(
          'Error inesperado al obtener los restaurantes del usuario',
        );
      }

      staffRestaurants = data ?? [];
    }

    return [...(owned ?? []), ...staffRestaurants]
      .sort((a, b) => a.id - b.id)
      .map((r) => this.toRestaurantDto(r));
  }

  private toRestaurantDto(restaurant: Restaurant): RestaurantDto {
    return {
      id: restaurant.id,
      name: restaurant.name,
      owner_id: restaurant.owner_id,
      description: restaurant.description,
      address: restaurant.address,
    };
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

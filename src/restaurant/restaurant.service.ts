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
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantDto } from './dto/restaurant.dto';
import { TableService } from '../table/table.service';
import { MenuService } from '../menu/menu.service';
import { RestaurantStaffService } from './restaurant_staff.service';
import { RestaurantStaffRole } from '../utils/enums/restaurant-staff-role';

type Restaurant = Tables<'restaurant'>;

@Injectable()
export class RestaurantService {
  private readonly logger = new Logger(RestaurantService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly tableService: TableService,
    private readonly menuService: MenuService,
    private readonly restaurantStaffService: RestaurantStaffService,
  ) {}

  async findAll(): Promise<RestaurantDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('restaurant')
      .select(
        `*,
          tables:restaurant_table (*),
          menu (
            *,
            categories:category (
              *,
              products:product (*)
            )
          )
        `,
      )
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(`Error finding all restaurants: ${error.message}`);

      throw new InternalServerErrorException(
        'Error inesperado al obtener los restaurantes',
      );
    }

    return (data ?? []).map((restaurant) => {
      const tables = (restaurant.tables ?? []).map((table) =>
        this.tableService.toTableDto(table),
      );

      const menu = restaurant.menu
        ? this.menuService.toMenuDto(restaurant.menu)
        : undefined;

      return {
        ...this.toRestaurantDto(restaurant),
        tables,
        menu,
      };
    });
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

    if (!data) {
      throw new InternalServerErrorException(
        'Error inesperado al crear el restaurante',
      );
    }

    await this.restaurantStaffService.addStaff(
      data.id,
      ownerId,
      RestaurantStaffRole.OWNER,
    );

    return this.toRestaurantDto(data);
  }

  async findOne(id: number): Promise<RestaurantDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('restaurant')
      .select(
        `*,
          tables:restaurant_table (*),
          menu (
            *,
            categories:category (
              *,
              products:product (*)
            )
          )
        `,
      )
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

    const tables = (data.tables ?? []).map((table) =>
      this.tableService.toTableDto(table),
    );

    const menu = data.menu ? this.menuService.toMenuDto(data.menu) : undefined;

    return {
      ...this.toRestaurantDto(data),
      tables,
      menu,
    };
  }

  /**
   * Restaurants linked to the user as owner (`owner_id`) or as staff (`restaurant_staff`).
   * Owner is not modeled as staff; lists are concatenated without deduplication.
   */
  async findMyRestaurants(userId: string): Promise<RestaurantDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('restaurant_staff')
      .select('restaurant_id')
      .eq('user_id', userId);

    if (error) {
      this.logger.error(
        `Error finding staff restaurants for user_id ${userId}: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener los restaurantes del usuario',
      );
    }

    const ids = (data ?? []).map((row) => row.restaurant_id);

    let staffRestaurants: Restaurant[] = [];

    if (ids.length > 0) {
      const { data, error } = await supabase
        .from('restaurant')
        .select('*')
        .in('id', ids);

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

    return staffRestaurants
      .sort((a, b) => a.id - b.id)
      .map((r) => this.toRestaurantDto(r));
  }

  async update(id: number, dto: UpdateRestaurantDto): Promise<RestaurantDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('restaurant')
      .update({
        name: dto.name,
        description: dto.description ?? null,
        address: dto.address ?? null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error updating restaurant ${id}: ${error.message}`);

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException(
          'Datos inválidos para actualizar el restaurante',
        );
      }

      throw new InternalServerErrorException(
        'Error inesperado al actualizar el restaurante',
      );
    }

    if (!data) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    return this.toRestaurantDto(data);
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

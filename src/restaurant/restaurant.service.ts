import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Tables } from '../supabase/database.types';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { RestaurantDto } from './dto/restaurant.dto';

type Restaurant = Tables<'restaurant'>;

@Injectable()
export class RestaurantService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(): Promise<RestaurantDto[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('restaurant')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []).map((restaurant) => this.toRestaurantDto(restaurant));
  }

  async create(
    createRestaurantDto: CreateRestaurantDto,
    ownerId: string,
  ): Promise<RestaurantDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: owner, error: ownerError } = await supabase
      .from('app_user')
      .select('id')
      .eq('id', ownerId)
      .maybeSingle();

    if (ownerError) {
      throw new InternalServerErrorException(ownerError.message);
    }

    if (!owner) {
      throw new BadRequestException(
        `owner_id '${ownerId}' does not exist in app_user`,
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
      throw new InternalServerErrorException(error.message);
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

  // Get a restaurant by id
  async findOne(id: number): Promise<RestaurantDto> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('restaurant')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return this.toRestaurantDto(data);
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
      throw new InternalServerErrorException(ownedError.message);
    }
    if (staffError) {
      throw new InternalServerErrorException(staffError.message);
    }

    const staffIds = (staffRows ?? []).map((row) => row.restaurant_id);

    let staffRestaurants: Restaurant[] = [];
    if (staffIds.length > 0) {
      const { data, error } = await supabase
        .from('restaurant')
        .select('*')
        .in('id', staffIds);

      if (error) {
        throw new InternalServerErrorException(error.message);
      }
      staffRestaurants = data ?? [];
    }

    return [...(owned ?? []), ...staffRestaurants]
      .sort((a, b) => a.id - b.id)
      .map((r) => this.toRestaurantDto(r));
  }
}

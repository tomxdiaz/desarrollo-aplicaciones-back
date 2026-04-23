import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Tables } from '../supabase/database.types';
import { CategoryDto } from './dto/category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { MenuDto } from './dto/menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

type Menu = Tables<'menu'>;
type Category = Tables<'category'>;

@Injectable()
export class MenuService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findMenuByRestaurantId(restaurantId: number): Promise<MenuDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(
        `menu for restaurant_id '${restaurantId}' was not found`,
      );
    }

    return this.toMenuDto(data);
  }

  async findCategoriesByRestaurantId(
    restaurantId: number,
  ): Promise<CategoryDto[]> {
    const menu = await this.getMenuByRestaurantIdOrThrow(restaurantId);
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('category')
      .select('*')
      .eq('menu_id', menu.id)
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []).map((category) => this.toCategoryDto(category));
  }

  async createCategory(
    restaurantId: number,
    createCategoryDto: CreateCategoryDto,
    userId: string,
  ): Promise<CategoryDto> {
    const menu = await this.getMenuByRestaurantIdOrThrow(restaurantId);
    await this.assertCanManageCategories(restaurantId, userId);

    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('category')
      .insert({
        menu_id: menu.id,
        name: createCategoryDto.name,
      })
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return this.toCategoryDto(data);
  }

  async updateMenuName(
    restaurantId: number,
    updateMenuDto: UpdateMenuDto,
  ): Promise<MenuDto> {
    const menu = await this.getMenuByRestaurantIdOrThrow(restaurantId);

    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('menu')
      .update({ name: updateMenuDto.name })
      .eq('id', menu.id)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return this.toMenuDto(data);
  }

  async deleteCategory(
    restaurantId: number,
    categoryId: number,
    userId: string,
  ): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    // Get menu for restaurantId
    const menu = await this.getMenuByRestaurantIdOrThrow(restaurantId);

    // Check category exists and belongs to this menu
    const { data: category, error: categoryError } = await supabase
      .from('category')
      .select('id, menu_id')
      .eq('id', categoryId)
      .maybeSingle();

    if (categoryError) {
      throw new InternalServerErrorException(categoryError.message);
    }

    if (!category) {
      throw new NotFoundException(`category_id '${categoryId}' was not found`);
    }

    if (category.menu_id !== menu.id) {
      throw new ForbiddenException(
        'Category does not belong to this restaurant',
      );
    }

    // Permission check
    await this.assertCanManageCategories(restaurantId, userId);

    // Delete
    const { error: deleteError } = await supabase
      .from('category')
      .delete()
      .eq('id', categoryId);

    if (deleteError) {
      throw new InternalServerErrorException(deleteError.message);
    }
  }

  private async getMenuByRestaurantIdOrThrow(
    restaurantId: number,
  ): Promise<Menu> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(
        `menu for restaurant_id '${restaurantId}' was not found`,
      );
    }

    return data;
  }

  private async assertCanManageCategories(
    restaurantId: number,
    userId: string,
  ): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurant')
      .select('owner_id')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restaurantError) {
      throw new InternalServerErrorException(restaurantError.message);
    }

    if (!restaurant) {
      throw new NotFoundException(
        `restaurant_id '${restaurantId}' was not found`,
      );
    }

    if (restaurant.owner_id === userId) {
      return;
    }

    const { data: staff, error: staffError } = await supabase
      .from('restaurant_staff')
      .select('role')
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (staffError) {
      throw new InternalServerErrorException(staffError.message);
    }

    if (!staff || staff.role !== 'CASHIER_PLUS') {
      throw new ForbiddenException(
        'Only restaurant owner or CASHIER_PLUS can manage menu categories',
      );
    }
  }

  private toMenuDto(menu: Menu): MenuDto {
    return {
      id: menu.id,
      restaurant_id: menu.restaurant_id,
      name: menu.name,
    };
  }

  private toCategoryDto(category: Category): CategoryDto {
    return {
      id: category.id,
      menu_id: category.menu_id,
      name: category.name,
    };
  }
}

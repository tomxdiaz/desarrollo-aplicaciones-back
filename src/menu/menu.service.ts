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
import { ProductDto } from './dto/product.dto';
import { CreateProductDto } from './dto/create-product.dto';

type Menu = Tables<'menu'>;
type Category = Tables<'category'>;
type Product = Tables<'product'>;

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
  ): Promise<CategoryDto> {
    const menu = await this.getMenuByRestaurantIdOrThrow(restaurantId);

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

  async createProduct(createProductDto: CreateProductDto): Promise<ProductDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('product')
      .insert({
        category_id: createProductDto.category_id,
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        image: createProductDto.image,
      })
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return this.toProductDto(data);
  }

  async deleteProduct(productId: number): Promise<ProductDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('product')
      .delete()
      .eq('id', productId)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return this.toProductDto(data);
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

  private toProductDto(product: Product): ProductDto {
    return {
      id: product.id,
      category_id: product.category_id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
    };
  }
}

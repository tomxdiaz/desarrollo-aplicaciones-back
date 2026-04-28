import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
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
  private readonly logger = new Logger(MenuService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

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
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Error updating menu name for menu_id ${menu.id}: ${error.message}`,
      );

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException(
          'Datos inválidos para actualizar el menú',
        );
      }

      throw new InternalServerErrorException(
        'Error inesperado al actualizar el menú',
      );
    }

    if (!data) {
      throw new NotFoundException('Restaurante o menú no encontrado');
    }

    return this.toMenuDto(data);
  }

  async findMenuByRestaurantId(restaurantId: number): Promise<MenuDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Error finding menu for restaurant_id ${restaurantId}: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener el menú',
      );
    }

    if (!data) {
      throw new NotFoundException('Restaurante o menú no encontrado');
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
      this.logger.error(
        `Error finding categories for menu_id ${menu.id}: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener las categorías',
      );
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
      this.logger.error(
        `Error creating category for menu_id ${menu.id}: ${error.message}`,
      );

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException(
          'Datos inválidos para crear la categoría',
        );
      }

      throw new InternalServerErrorException(
        'Error inesperado al crear la categoría',
      );
    }

    return this.toCategoryDto(data);
  }

  async deleteCategory(
    restaurantId: number,
    categoryId: number,
  ): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const menu = await this.getMenuByRestaurantIdOrThrow(restaurantId);

    const { data: category, error: categoryError } = await supabase
      .from('category')
      .select('id, menu_id')
      .eq('id', categoryId)
      .maybeSingle();

    if (categoryError) {
      this.logger.error(
        `Error finding category_id ${categoryId}: ${categoryError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener la categoría',
      );
    }

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category.menu_id !== menu.id) {
      throw new ForbiddenException(
        'La categoría no pertenece a este restaurante',
      );
    }

    const { error: deleteError } = await supabase
      .from('category')
      .delete()
      .eq('id', categoryId);

    if (deleteError) {
      this.logger.error(
        `Error deleting category_id ${categoryId}: ${deleteError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al eliminar la categoría',
      );
    }
  }

  async findProductsByRestaurantId(
    restaurantId: number,
  ): Promise<ProductDto[]> {
    const menu = await this.getMenuByRestaurantIdOrThrow(restaurantId);
    const supabase = this.supabaseService.getAdminClient();

    const { data: categories, error: categoriesError } = await supabase
      .from('category')
      .select('id')
      .eq('menu_id', menu.id);

    if (categoriesError) {
      this.logger.error(
        `Error finding categories for menu_id ${menu.id}: ${categoriesError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener las categorías',
      );
    }

    const categoryIds = (categories ?? []).map((category) => category.id);

    if (categoryIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('product')
      .select('*')
      .in('category_id', categoryIds)
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(
        `Error finding products for menu_id ${menu.id}: ${error.message}`,
      );

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException('restaurantId inválido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al obtener los productos',
      );
    }

    return (data ?? []).map((product) => this.toProductDto(product));
  }

  async createProduct(
    restaurantId: number,
    createProductDto: CreateProductDto,
  ): Promise<ProductDto> {
    const supabase = this.supabaseService.getAdminClient();

    const menu = await this.getMenuByRestaurantIdOrThrow(restaurantId);

    const { data: category, error: categoryError } = await supabase
      .from('category')
      .select('id, menu_id')
      .eq('id', createProductDto.category_id)
      .maybeSingle();

    if (categoryError) {
      this.logger.error(
        `Error finding category_id ${createProductDto.category_id}: ${categoryError.message}`,
      );

      if (this.isBadRequestDatabaseError(categoryError)) {
        throw new BadRequestException('Datos inválidos para crear el producto');
      }

      throw new InternalServerErrorException(
        'Error inesperado al obtener la categoría',
      );
    }

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category.menu_id !== menu.id) {
      throw new ForbiddenException(
        'La categoría no pertenece a este restaurante',
      );
    }

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
      this.logger.error(`Error creating product: ${error.message}`);

      if (this.isForeignKeyViolation(error)) {
        throw new NotFoundException('Categoría no encontrada');
      }

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException('Datos inválidos para crear el producto');
      }

      throw new InternalServerErrorException(
        'Error inesperado al crear el producto',
      );
    }

    return this.toProductDto(data);
  }

  async deleteProduct(
    restaurantId: number,
    productId: number,
  ): Promise<ProductDto> {
    const supabase = this.supabaseService.getAdminClient();

    const menu = await this.getMenuByRestaurantIdOrThrow(restaurantId);

    const { data: product, error: productError } = await supabase
      .from('product')
      .select('*, category!inner(id, menu_id)')
      .eq('id', productId)
      .maybeSingle();

    if (productError) {
      this.logger.error(
        `Error finding product_id ${productId}: ${productError.message}`,
      );

      if (this.isBadRequestDatabaseError(productError)) {
        throw new BadRequestException('productId inválido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al obtener el producto',
      );
    }

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.category.menu_id !== menu.id) {
      throw new ForbiddenException(
        'El producto no pertenece a este restaurante',
      );
    }

    const { data, error } = await supabase
      .from('product')
      .delete()
      .eq('id', productId)
      .select('*')
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Error deleting product_id ${productId}: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al eliminar el producto',
      );
    }

    if (!data) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.toProductDto(data);
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
      this.logger.error(
        `Error finding menu for restaurant_id ${restaurantId}: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener el menú',
      );
    }

    if (!data) {
      throw new NotFoundException('Restaurante o menú no encontrado');
    }

    return data;
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

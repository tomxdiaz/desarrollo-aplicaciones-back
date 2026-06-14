import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { UploadedImage } from '../supabase/supabase.service';
import type { Tables, TablesUpdate } from '../supabase/database.types';
import { CategoryDto } from './dto/category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { MenuDto } from './dto/menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { ProductDto } from './dto/product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type Menu = Tables<'menu'>;
type Category = Tables<'category'>;
type Product = Tables<'product'>;
type ProductUpdate = TablesUpdate<'product'>;

type CategoryWithProducts = Category & {
  products?: Product[];
};

type MenuWithCategories = Menu & {
  categories?: CategoryWithProducts[];
};

type ProductWithCategory = Product & {
  category: Pick<Category, 'id' | 'menu_id'>;
};

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
      .select('id, menu_id, active')
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

    if (!category || !category.active) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category.menu_id !== menu.id) {
      throw new ForbiddenException(
        'La categoría no pertenece a este restaurante',
      );
    }

    const { error: productsDeleteError } = await supabase
      .from('product')
      .update({ active: false })
      .eq('category_id', categoryId)
      .eq('active', true);

    if (productsDeleteError) {
      this.logger.error(
        `Error deleting products for category_id ${categoryId}: ${productsDeleteError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al eliminar los productos de la categoría',
      );
    }

    const { data: deletedCategory, error: categoryDeleteError } = await supabase
      .from('category')
      .update({ active: false })
      .eq('id', categoryId)
      .eq('menu_id', menu.id)
      .eq('active', true)
      .select('id')
      .maybeSingle();

    if (categoryDeleteError) {
      this.logger.error(
        `Error deleting category_id ${categoryId}: ${categoryDeleteError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al eliminar la categoría',
      );
    }

    if (!deletedCategory) {
      throw new NotFoundException('Categoría no encontrada');
    }
  }

  async createProduct(
    restaurantId: number,
    createProductDto: CreateProductDto,
    image?: UploadedImage,
  ): Promise<ProductDto> {
    const supabase = this.supabaseService.getAdminClient();

    const menu = await this.getMenuByRestaurantIdOrThrow(restaurantId);

    const { data: category, error: categoryError } = await supabase
      .from('category')
      .select('id, menu_id, active')
      .eq('id', createProductDto.category_id)
      .eq('active', true)
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

    const uploadedUrl = await this.supabaseService.uploadImage(
      image,
      `restaurant-${restaurantId}/products`,
    );
    const imageUrl = uploadedUrl ?? createProductDto.existingImage ?? null;

    const { data, error } = await supabase
      .from('product')
      .insert({
        category_id: createProductDto.category_id,
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        image: imageUrl,
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
      .eq('active', true)
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

    const existingProduct = product as ProductWithCategory;

    if (existingProduct.category.menu_id !== menu.id) {
      throw new ForbiddenException(
        'El producto no pertenece a este restaurante',
      );
    }

    const { data, error } = await supabase
      .from('product')
      .update({ active: false })
      .eq('id', productId)
      .eq('category_id', existingProduct.category_id)
      .eq('active', true)
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
    await this.ensureRestaurantExists(restaurantId);

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
      throw new NotFoundException('Menú no encontrado');
    }

    return data;
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

  public toMenuDto(menu: MenuWithCategories): MenuDto {
    return {
      id: menu.id,
      restaurant_id: menu.restaurant_id,
      name: menu.name,
      categories: (menu.categories ?? []).map((category) =>
        this.toCategoryDto(category),
      ),
    };
  }

  private toCategoryDto(category: CategoryWithProducts): CategoryDto {
    return {
      id: category.id,
      menu_id: category.menu_id,
      name: category.name,
      active: category.active,
      products: (category.products ?? []).map((product) =>
        this.toProductDto(product),
      ),
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
      active: product.active,
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

  /* ----------------
  Actualizar producto
  -----------------*/

  async updateProduct(
    restaurantId: number,
    productId: number,
    updateProductDto: UpdateProductDto,
    image?: UploadedImage,
  ): Promise<ProductDto> {
    const supabase = this.supabaseService.getAdminClient();
    const menu = await this.getMenuByRestaurantIdOrThrow(restaurantId);

    const patch = this.toProductUpdatePayload(updateProductDto);
    const hasImageChange =
      !!image || updateProductDto.existingImage !== undefined;
    if (Object.keys(patch).length === 0 && !hasImageChange) {
      throw new BadRequestException(
        'Debe enviar al menos un campo a actualizar',
      );
    }

    const { data: existing, error: productError } = await supabase
      .from('product')
      .select('*, category!inner(id, menu_id)')
      .eq('id', productId)
      .eq('active', true)
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

    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }

    const existingProduct = existing as ProductWithCategory;

    if (existingProduct.category.menu_id !== menu.id) {
      throw new ForbiddenException(
        'El producto no pertenece a este restaurante',
      );
    }

    if (patch.category_id !== undefined) {
      const { data: category, error: categoryError } = await supabase
        .from('category')
        .select('id, menu_id, active')
        .eq('id', patch.category_id)
        .eq('active', true)
        .maybeSingle();

      if (categoryError) {
        this.logger.error(
          `Error finding category_id ${patch.category_id}: ${categoryError.message}`,
        );

        if (this.isBadRequestDatabaseError(categoryError)) {
          throw new BadRequestException(
            'Datos inválidos para actualizar el producto',
          );
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
    }

    if (hasImageChange) {
      const uploadedUrl = await this.supabaseService.uploadImage(
        image,
        `restaurant-${restaurantId}/products`,
      );
      patch.image = uploadedUrl ?? updateProductDto.existingImage ?? null;
    }

    const { data, error } = await supabase
      .from('product')
      .update(patch)
      .eq('id', productId)
      .eq('active', true)
      .select('*')
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Error updating product_id ${productId}: ${error.message}`,
      );

      if (this.isForeignKeyViolation(error)) {
        throw new NotFoundException('Categoría no encontrada');
      }

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException(
          'Datos inválidos para actualizar el producto',
        );
      }

      throw new InternalServerErrorException(
        'Error inesperado al actualizar el producto',
      );
    }

    if (!data) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.toProductDto(data);
  }

  private toProductUpdatePayload(dto: UpdateProductDto): ProductUpdate {
    const patch: ProductUpdate = {};

    if (dto.category_id !== undefined) {
      patch.category_id = dto.category_id;
    }
    if (dto.name !== undefined) {
      patch.name = dto.name;
    }
    if (dto.description !== undefined) {
      patch.description = dto.description;
    }
    if (dto.price !== undefined) {
      patch.price = dto.price;
    }

    return patch;
  }
}

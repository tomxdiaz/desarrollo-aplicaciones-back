import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { Tables } from '../supabase/database.types';
import { CategoryDto } from './dto/category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { MenuDto } from './dto/menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuService } from './menu.service';
import { RestaurantRolesGuard } from '../auth/guards/restaurant-roles.guard';
import { RestaurantRoles } from '../auth/decorators/restaurant-roles.decorator';
import { ProductDto } from './dto/product.dto';
import { CreateProductDto } from './dto/create-product.dto';

type AppUser = Tables<'app_user'>;

@ApiTags('menu')
@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('restaurant/:restaurantId/menu')
  @ApiOperation({ summary: 'Obtener el menú de un restaurante' })
  @ApiOkResponse({
    description: 'Menú obtenido correctamente',
    type: MenuDto,
  })
  @ApiBadRequestResponse({
    description: 'restaurantId inválido',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante o menú no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  async findMenuByRestaurantId(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<MenuDto> {
    return await this.menuService.findMenuByRestaurantId(restaurantId);
  }

  @Patch('restaurant/:restaurantId/menu')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el nombre del menú de un restaurante' })
  @ApiOkResponse({
    description: 'Nombre del menú actualizado correctamente',
    type: MenuDto,
  })
  @ApiBadRequestResponse({
    description:
      'restaurantId inválido o datos inválidos para actualizar el menú',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes en este restaurante',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante o menú no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN', 'CASHIER_PLUS')
  async updateMenuName(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() updateMenuDto: UpdateMenuDto,
  ): Promise<MenuDto> {
    return await this.menuService.updateMenuName(restaurantId, updateMenuDto);
  }

  @Get('restaurant/:restaurantId/menu/categories')
  @ApiOperation({
    summary: 'Obtener las categorías del menú de un restaurante',
  })
  @ApiOkResponse({
    description: 'Categorías obtenidas correctamente',
    type: CategoryDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'restaurantId inválido',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante o menú no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  async findCategoriesByRestaurantId(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<CategoryDto[]> {
    return await this.menuService.findCategoriesByRestaurantId(restaurantId);
  }

  @Post('restaurant/:restaurantId/menu/categories')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear una nueva categoría en el menú de un restaurante',
  })
  @ApiCreatedResponse({
    description: 'Categoría creada correctamente',
    type: CategoryDto,
  })
  @ApiBadRequestResponse({
    description:
      'restaurantId inválido o datos inválidos para crear la categoría',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes en este restaurante',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante o menú no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN', 'CASHIER_PLUS')
  async createCategory(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @CurrentAppUser appUser: AppUser,
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryDto> {
    return await this.menuService.createCategory(
      restaurantId,
      createCategoryDto,
    );
  }

  @Delete('restaurant/:restaurantId/menu/categories/:categoryId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar una categoría del menú de un restaurante',
  })
  @ApiOkResponse({
    description: 'Categoría eliminada correctamente',
  })
  @ApiBadRequestResponse({
    description: 'restaurantId o categoryId inválido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes en este restaurante',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante, menú o categoría no encontrada',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN', 'CASHIER_PLUS')
  async deleteCategory(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<void> {
    return await this.menuService.deleteCategory(restaurantId, categoryId);
  }

  @Get('restaurant/:restaurantId/menu/product')
  @ApiOperation({
    summary: 'Obtener todos los productos del menú de un restaurante',
  })
  @ApiOkResponse({
    description: 'Productos obtenidos correctamente',
    type: ProductDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'restaurantId inválido',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante o menú no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  async findProductsByRestaurantId(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<ProductDto[]> {
    return await this.menuService.findProductsByRestaurantId(restaurantId);
  }

  @Post('restaurant/:restaurantId/menu/product')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear un nuevo producto en el menú de un restaurante',
  })
  @ApiCreatedResponse({
    description: 'Producto creado correctamente',
    type: ProductDto,
  })
  @ApiBadRequestResponse({
    description:
      'restaurantId inválido o datos inválidos para crear el producto',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes en este restaurante',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante, menú o categoría no encontrada',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN', 'CASHIER_PLUS')
  async createProduct(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductDto> {
    return await this.menuService.createProduct(restaurantId, createProductDto);
  }

  @Delete('restaurant/:restaurantId/menu/product/:productId')
  @ApiOperation({
    summary: 'Eliminar un producto del menú de un restaurante',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Producto eliminado correctamente',
    type: ProductDto,
  })
  @ApiBadRequestResponse({
    description: 'restaurantId o productId inválido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes en este restaurante',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante, menú o producto no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN', 'CASHIER_PLUS')
  async deleteProduct(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<ProductDto> {
    return await this.menuService.deleteProduct(restaurantId, productId);
  }
}

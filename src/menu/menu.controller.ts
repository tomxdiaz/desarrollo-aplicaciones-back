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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  async findMenuByRestaurantId(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<MenuDto> {
    return await this.menuService.findMenuByRestaurantId(restaurantId);
  }

  @Patch('restaurant/:restaurantId/menu')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el nombre del menú de un restaurante' })
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
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN', 'CASHIER_PLUS')
  async deleteCategory(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<void> {
    return await this.menuService.deleteCategory(restaurantId, categoryId);
  }

  @Post('restaurant/:restaurantId/menu/product')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear un nuevo producto en el menú de un restaurante',
  })
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN', 'CASHIER_PLUS')
  async createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductDto> {
    return await this.menuService.createProduct(createProductDto);
  }

  @Delete('restaurant/:restaurantId/menu/product/:productId')
  @ApiOperation({
    summary: 'Eliminar un producto del menú de un restaurante',
  })
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN', 'CASHIER_PLUS')
  async deleteProduct(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<ProductDto> {
    return await this.menuService.deleteProduct(productId);
  }
}

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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

type AppUser = Tables<'app_user'>;

@ApiTags('menu')
@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('restaurant/:id/menu')
  async findMenuByRestaurantId(
    @Param('id', ParseIntPipe) restaurantId: number,
  ): Promise<MenuDto> {
    return await this.menuService.findMenuByRestaurantId(restaurantId);
  }

  @Get('restaurant/:id/menu/categories')
  async findCategoriesByRestaurantId(
    @Param('id', ParseIntPipe) restaurantId: number,
  ): Promise<CategoryDto[]> {
    return await this.menuService.findCategoriesByRestaurantId(restaurantId);
  }

  @Post('restaurant/:id/menu/categories')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN', 'CASHIER_PLUS')
  async createCategory(
    @Param('id', ParseIntPipe) restaurantId: number,
    @CurrentAppUser appUser: AppUser,
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryDto> {
    return await this.menuService.createCategory(
      restaurantId,
      createCategoryDto,
      appUser.id,
    );
  }

  @Delete('menu/categories/:categoryId')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  async deleteCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @CurrentAppUser appUser: AppUser,
  ): Promise<void> {
    return await this.menuService.deleteCategory(categoryId, appUser.id);
  }

  @Patch('restaurant/:id/menu')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  async updateMenuName(
    @Param('id', ParseIntPipe) restaurantId: number,
    @CurrentAppUser appUser: AppUser,
    @Body() updateMenuDto: UpdateMenuDto,
  ): Promise<MenuDto> {
    return await this.menuService.updateMenuName(
      restaurantId,
      updateMenuDto,
      appUser.id,
    );
  }
}

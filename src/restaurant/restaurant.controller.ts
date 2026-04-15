import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { RestaurantDto } from './dto/restaurant.dto';
import { Param } from '@nestjs/common';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { Tables } from '../supabase/database.types';
import { AppRole } from '../utils/enums/roles';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

type AppUser = Tables<'app_user'>;

@ApiTags('restaurant')
@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  // Get all restaurants
  @Get()
  async findAll(): Promise<RestaurantDto[]> {
    return await this.restaurantService.findAll();
  }

  // Get my restaurants (must be declared before :id so "me" is not parsed as id)
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  async findMyRestaurants(
    @CurrentAppUser appUser: AppUser,
  ): Promise<RestaurantDto[]> {
    return await this.restaurantService.findMyRestaurants(appUser.id);
  }

  // Get a restaurant by id
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<RestaurantDto> {
    return await this.restaurantService.findOne(id);
  }

  // Create a new restaurant
  @Post()
  @ApiBearerAuth()
  @Roles(AppRole.SUPER_USER, AppRole.OWNER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  async create(
    @CurrentAppUser appUser: AppUser,
    @Body() createRestaurantDto: CreateRestaurantDto,
  ): Promise<RestaurantDto> {
    return await this.restaurantService.create(createRestaurantDto, appUser.id);
  }
}

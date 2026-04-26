import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  UseGuards,
  Param,
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
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { RestaurantDto } from './dto/restaurant.dto';
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

  @Get()
  @ApiOperation({ summary: 'Obtener todos los restaurantes' })
  @ApiOkResponse({
    description: 'Restaurantes obtenidos correctamente',
    type: RestaurantDto,
    isArray: true,
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  async findAll(): Promise<RestaurantDto[]> {
    return await this.restaurantService.findAll();
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis restaurantes' })
  @ApiOkResponse({
    description: 'Restaurantes del usuario obtenidos correctamente',
    type: RestaurantDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard)
  async findMyRestaurants(
    @CurrentAppUser appUser: AppUser,
  ): Promise<RestaurantDto[]> {
    return await this.restaurantService.findMyRestaurants(appUser.id);
  }

  @Get(':restaurantId')
  @ApiOperation({ summary: 'Obtener un restaurante por ID' })
  @ApiOkResponse({
    description: 'Restaurante obtenido correctamente',
    type: RestaurantDto,
  })
  @ApiBadRequestResponse({
    description: 'restaurantId inválido',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  async findOne(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<RestaurantDto> {
    return await this.restaurantService.findOne(restaurantId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo restaurante' })
  @ApiBearerAuth()
  @ApiCreatedResponse({
    description: 'Restaurante creado correctamente',
    type: RestaurantDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos para crear el restaurante',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @Roles(AppRole.SUPER_USER, AppRole.OWNER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  async create(
    @CurrentAppUser appUser: AppUser,
    @Body() createRestaurantDto: CreateRestaurantDto,
  ): Promise<RestaurantDto> {
    return await this.restaurantService.create(createRestaurantDto, appUser.id);
  }
}

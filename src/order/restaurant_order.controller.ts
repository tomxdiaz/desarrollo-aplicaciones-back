import {
  Controller,
  Get,
  UseGuards,
  Param,
  ParseIntPipe,
  Patch,
  Body,
  Post,
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
import { RestaurantRoles } from '../auth/decorators/restaurant-roles.decorator';
import { RestaurantRolesGuard } from '../auth/guards/restaurant-roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RestaurantStaffRole } from '../utils/enums/restaurant-staff-role';
import { OrderDto } from './dto/order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('restaurant-orders')
@Controller('restaurants/:restaurantId/orders')
export class RestaurantOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear un nuevo pedido',
  })
  @ApiCreatedResponse({
    description: 'Pedido creado correctamente',
    type: OrderDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos para crear el pedido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiNotFoundResponse({
    description:
      'Restaurante, mesa, producto o usuario relacionado no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard)
  async create(
    @CurrentAppUser appUser: AppUser,
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderDto> {
    return await this.orderService.create(appUser.id, restaurantId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener los pedidos de un restaurante',
  })
  @ApiOkResponse({
    description: 'Pedidos del restaurante obtenidos correctamente',
    type: OrderDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'restaurantId inválido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes en este restaurante',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @RestaurantRoles(
    RestaurantStaffRole.ADMIN,
    RestaurantStaffRole.CASHIER_PLUS,
    RestaurantStaffRole.CASHIER,
  )
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  async findByRestaurant(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<OrderDto[]> {
    return await this.orderService.findByRestaurant(restaurantId);
  }

  @Patch(':orderId/status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar el estado de un pedido',
  })
  @ApiOkResponse({
    description: 'Estado del pedido actualizado correctamente',
    type: OrderDto,
  })
  @ApiBadRequestResponse({
    description: 'restaurantId, orderId o estado inválido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes en este restaurante',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante o pedido no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @RestaurantRoles(
    RestaurantStaffRole.ADMIN,
    RestaurantStaffRole.CASHIER_PLUS,
    RestaurantStaffRole.CASHIER,
  )
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  async updateStatus(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderDto> {
    return await this.orderService.updateStatus(
      restaurantId,
      orderId,
      dto.status,
    );
  }
}

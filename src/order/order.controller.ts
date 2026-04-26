import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderDto } from './dto/order.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RestaurantRolesGuard } from '../auth/guards/restaurant-roles.guard';
import { RestaurantRoles } from '../auth/decorators/restaurant-roles.decorator';
import { RestaurantStaffRole } from '../utils/enums/restaurant-staff-role';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import type { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('orders')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear un nuevo pedido',
  })
  @UseGuards(SupabaseAuthGuard)
  async create(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderDto> {
    return await this.orderService.create(appUser.id, dto);
  }

  @Get('mine')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener mis pedidos',
  })
  @UseGuards(SupabaseAuthGuard)
  async findMine(@CurrentAppUser appUser: AppUser): Promise<OrderDto[]> {
    return await this.orderService.findMine(appUser.id);
  }

  @Get('restaurant/:restaurantId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener los pedidos de un restaurante',
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
  @RestaurantRoles(
    RestaurantStaffRole.ADMIN,
    RestaurantStaffRole.CASHIER_PLUS,
    RestaurantStaffRole.CASHIER,
  )
  @UseGuards(SupabaseAuthGuard)
  async updateStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentAppUser appUser: AppUser,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderDto> {
    return await this.orderService.updateStatus(orderId, appUser, dto.status);
  }
}

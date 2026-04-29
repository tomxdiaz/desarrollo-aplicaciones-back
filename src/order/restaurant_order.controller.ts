import {
  Controller,
  Get,
  UseGuards,
  Param,
  ParseIntPipe,
  Patch,
  Body,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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

@ApiTags('restaurant-orders')
@Controller('restaurants/:restaurantId/orders')
export class RestaurantOrderController {
  constructor(private readonly orderService: OrderService) {}

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

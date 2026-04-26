import { Controller, Post, UseGuards, Body, Get } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDto } from './dto/order.dto';
import { OrderService } from './order.service';
import { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('orders')
@Controller('orders')
export class OrderController {
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
    @Body() dto: CreateOrderDto,
  ): Promise<OrderDto> {
    return await this.orderService.create(appUser.id, dto);
  }

  @Get('mine')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener mis pedidos',
  })
  @ApiOkResponse({
    description: 'Pedidos del usuario obtenidos correctamente',
    type: OrderDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard)
  async findMine(@CurrentAppUser appUser: AppUser): Promise<OrderDto[]> {
    return await this.orderService.findMine(appUser.id);
  }
}

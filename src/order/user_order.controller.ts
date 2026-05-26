import { Controller, UseGuards, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrderDto } from './dto/order.dto';
import { OrderService } from './order.service';
import { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('orders')
@Controller('orders')
export class UserOrderController {
  constructor(private readonly orderService: OrderService) {}

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

  @Get(':orderId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener el detalle de un pedido mío',
  })
  @ApiOkResponse({
    description: 'Pedido obtenido correctamente',
    type: OrderDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiNotFoundResponse({
    description: 'Pedido no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard)
  async findMineById(
    @CurrentAppUser appUser: AppUser,
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<OrderDto> {
    return await this.orderService.findMineById(appUser.id, orderId);
  }
}

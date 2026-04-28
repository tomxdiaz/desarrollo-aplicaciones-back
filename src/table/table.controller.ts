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
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';
import { TableDto } from './dto/table.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RestaurantRolesGuard } from '../auth/guards/restaurant-roles.guard';
import { RestaurantRoles } from '../auth/decorators/restaurant-roles.decorator';
import { RestaurantStaffRole } from '../utils/enums/restaurant-staff-role';

@ApiTags('tables')
@Controller('restaurant/:restaurantId/tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las mesas para un restaurante' })
  @ApiOkResponse({
    description: 'Mesas obtenidas correctamente',
    type: TableDto,
    isArray: true,
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
  async findAll(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<TableDto[]> {
    return await this.tableService.findAllByRestaurant(restaurantId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva mesa para un restaurante' })
  @ApiCreatedResponse({
    description: 'Mesa creada correctamente',
    type: TableDto,
  })
  @ApiBadRequestResponse({
    description: 'restaurantId inválido o datos inválidos para crear la mesa',
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
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles(RestaurantStaffRole.ADMIN)
  async create(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() createTableDto: CreateTableDto,
  ): Promise<TableDto> {
    return await this.tableService.create(restaurantId, createTableDto);
  }

  @Delete(':tableId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una mesa de un restaurante' })
  @ApiOkResponse({
    description: 'Mesa eliminada correctamente',
    type: TableDto,
  })
  @ApiBadRequestResponse({
    description: 'restaurantId o tableId inválido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes en este restaurante',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante o mesa no encontrada',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles(RestaurantStaffRole.ADMIN)
  async delete(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
  ): Promise<TableDto> {
    return await this.tableService.delete(restaurantId, tableId);
  }

  @Patch(':tableId/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el estado de una mesa' })
  @ApiOkResponse({
    description: 'Estado de la mesa actualizado correctamente',
    type: TableDto,
  })
  @ApiBadRequestResponse({
    description: 'restaurantId, tableId o estado inválido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes en este restaurante',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante o mesa no encontrada',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles(
    RestaurantStaffRole.ADMIN,
    RestaurantStaffRole.CASHIER_PLUS,
    RestaurantStaffRole.CASHIER,
  )
  async updateStatus(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Body() updateTableStatusDto: UpdateTableStatusDto,
  ): Promise<TableDto> {
    return await this.tableService.updateStatus(
      restaurantId,
      tableId,
      updateTableStatusDto.status,
    );
  }
}

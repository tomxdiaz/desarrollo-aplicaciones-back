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
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';
import { TableDto } from './dto/table.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../utils/enums/roles';

@ApiTags('tables')
@Controller('restaurant/:restaurantId/tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las mesas para un restaurante' })
  async findAll(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<TableDto[]> {
    return await this.tableService.findAllByRestaurant(restaurantId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva mesa para un restaurante' })
  @Roles(AppRole.SUPER_USER, AppRole.OWNER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  async create(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() createTableDto: CreateTableDto,
  ): Promise<TableDto> {
    return await this.tableService.create(restaurantId, createTableDto);
  }

  @Delete(':tableId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una mesa de un restaurante' })
  @Roles(AppRole.SUPER_USER, AppRole.OWNER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  async delete(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
  ): Promise<TableDto> {
    return await this.tableService.delete(restaurantId, tableId);
  }

  @Patch(':tableId/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el estado de una mesa' })
  @Roles(AppRole.SUPER_USER, AppRole.OWNER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
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

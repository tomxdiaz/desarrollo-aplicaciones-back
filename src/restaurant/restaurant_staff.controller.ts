import {
  Body,
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
  Get,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RestaurantRolesGuard } from '../auth/guards/restaurant-roles.guard';
import { RestaurantRoles } from '../auth/decorators/restaurant-roles.decorator';
import { RestaurantStaffService } from './restaurant_staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { AppUserService } from '../app_user/app_user.service';
import { StaffDto } from './dto/staff.dto';
import { RestaurantStaffRole } from '../utils/enums/restaurant-staff-role';

@ApiTags('restaurant_staff')
@Controller('restaurant/:restaurantId/staff')
export class RestaurantStaffController {
  constructor(
    private readonly staffService: RestaurantStaffService,
    private readonly appUserService: AppUserService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el personal de un restaurante' })
  @ApiOkResponse({
    description: 'Personal del restaurante obtenido correctamente',
    type: StaffDto,
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
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles(RestaurantStaffRole.ADMIN)
  async getStaff(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<StaffDto[]> {
    return await this.staffService.getStaff(restaurantId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar personal a un restaurante' })
  @ApiBody({
    type: CreateStaffDto,
    examples: {
      admin: {
        summary: 'Agregar staff ADMIN',
        value: {
          email: 'staff1@example.com',
          role: RestaurantStaffRole.ADMIN,
        },
      },
      cashier: {
        summary: 'Agregar staff CASHIER',
        value: {
          email: 'staff2@example.com',
          role: RestaurantStaffRole.CASHIER,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Personal agregado correctamente',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'restaurantId inválido, body inválido o usuario con ese email inexistente',
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
  async addStaff(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: CreateStaffDto,
  ) {
    const user = await this.appUserService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    return this.staffService.addStaff(restaurantId, user.id, dto.role);
  }

  @Delete(':userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar personal de un restaurante' })
  @ApiOkResponse({
    description: 'Personal eliminado correctamente',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'restaurantId inválido o userId inválido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes en este restaurante',
  })
  @ApiNotFoundResponse({
    description: 'Restaurante o usuario del staff no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles(RestaurantStaffRole.ADMIN)
  async removeStaff(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('userId') userId: string,
  ) {
    return this.staffService.removeStaff(restaurantId, userId);
  }
}

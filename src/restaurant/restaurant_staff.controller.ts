import {
  Body,
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RestaurantRolesGuard } from '../auth/guards/restaurant-roles.guard';
import { RestaurantRoles } from '../auth/decorators/restaurant-roles.decorator';
import { RestaurantStaffService } from './restaurant_staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { AppUserService } from '../app_user/app_user.service';

@ApiTags('restaurant_staff')
@Controller('restaurant/:restaurantId/staff')
export class RestaurantStaffController {
  constructor(
    private readonly staffService: RestaurantStaffService,
    private readonly appUserService: AppUserService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN')
  @ApiOperation({ summary: 'Get staff for a restaurant' })
  @ApiResponse({
    status: 200,
    description: 'List of staff members',
    schema: {
      example: [
        {
          user_id: 'user-123',
          role: 'ADMIN',
          app_user: { email: 'staff1@example.com' },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Restaurant not found or user is not staff of this restaurant',
  })
  async getStaff(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return await this.staffService.getStaff(restaurantId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN')
  @ApiOperation({ summary: 'Add staff to a restaurant' })
  @ApiBody({
    type: CreateStaffDto,
    examples: {
      admin: {
        summary: 'Add admin staff',
        value: { email: 'staff1@example.com', role: 'ADMIN' },
      },
      cashier: {
        summary: 'Add cashier staff',
        value: { email: 'staff2@example.com', role: 'CASHIER' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Staff added',
    schema: { example: { success: true } },
  })
  @ApiResponse({
    status: 400,
    description: 'User with this email does not exist',
  })
  async addStaff(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: CreateStaffDto,
  ) {
    const user = await this.appUserService.findByEmail(dto.email);
    if (!user) {
      // Use BadRequestException for 400
      throw new Error('User with this email does not exist');
    }
    return this.staffService.addStaff(restaurantId, user.id, dto.role);
  }

  @Delete(':userId')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RestaurantRolesGuard)
  @RestaurantRoles('ADMIN')
  async removeStaff(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('userId') userId: string,
  ) {
    return this.staffService.removeStaff(restaurantId, userId);
  }
}

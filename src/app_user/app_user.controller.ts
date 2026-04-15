import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AppUserService } from './app_user.service';
import { AppUserDto } from './dto/app_user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../utils/enums/roles';
import type { Tables } from '../supabase/database.types';
import { UpdateGlobalRoleDto } from './dto/update-role.dto';

type AppUser = Tables<'app_user'>;

@ApiTags('app_user')
@Controller('app_user')
export class AppUserController {
  constructor(private readonly appUserService: AppUserService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  async findMe(@CurrentAppUser appUser: AppUser): Promise<AppUserDto> {
    return await this.appUserService.findById(appUser.id);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(AppRole.SUPER_USER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  async findAll(): Promise<AppUserDto[]> {
    return await this.appUserService.findAll();
  }

  @Patch('role')
  @ApiBearerAuth()
  @Roles(AppRole.SUPER_USER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  async updateGlobalRole(
    @Body() updateGlobalRoleDto: UpdateGlobalRoleDto,
  ): Promise<AppUserDto> {
    return await this.appUserService.updateGlobalRole(updateGlobalRoleDto);
  }
}

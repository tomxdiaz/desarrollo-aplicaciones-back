import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppUserDto } from './dto/app_user.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { Tables } from '../supabase/database.types';
import { UpdateGlobalRoleDto } from './dto/update-role.dto';

type AppUser = Tables<'app_user'>;

@Injectable()
export class AppUserService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findById(id: string): Promise<AppUserDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('app_user')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return this.toAppUserDto(data);
  }

  async findAll(): Promise<AppUserDto[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_user')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []).map((appUser) => this.toAppUserDto(appUser));
  }

  async updateGlobalRole(
    updateGlobalRoleDto: UpdateGlobalRoleDto,
  ): Promise<AppUserDto> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_user')
      .update({
        global_role: updateGlobalRoleDto.role as AppUser['global_role'],
      })
      .eq('id', updateGlobalRoleDto.appUserId)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return this.toAppUserDto(data);
  }

  toAppUserDto(appUser: AppUser): AppUserDto {
    return {
      id: appUser.id,
      email: appUser.email,
      global_role: appUser.global_role,
    };
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';
import type { Tables } from '../../supabase/database.types';

type AppUser = Tables<'app_user'>;

type AuthenticatedRequest = Request & {
  appUser?: AppUser;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);

    console.log('\n========== AUTH DEBUG ==========');

    if (!token) {
      console.log('❌ No Bearer token found');
      throw new UnauthorizedException('Falta el token de autenticación');
    }

    console.log('✅ Token received');
    console.log('Token preview:', token.slice(0, 20) + '...');

    const supabase = this.supabaseService.getAdminClient();

    console.log('🔍 Validating token with Supabase...');

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    console.log('USER ERROR:', userError);
    console.log('USER ID:', userData?.user?.id);
    console.log('USER EMAIL:', userData?.user?.email);

    if (userError || !userData.user) {
      console.log('❌ Token validation failed');
      console.log('================================\n');

      throw new UnauthorizedException('Token inválido o expirado');
    }

    console.log('✅ Token validation successful');
    console.log('🔍 Looking for app_user...');

    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();

    console.log('APP USER ERROR:', appUserError);
    console.log('APP USER:', appUser);

    if (appUserError) {
      console.log('❌ Database query failed');
      console.log('================================\n');

      throw new UnauthorizedException(
        'No se pudo cargar el perfil del usuario',
      );
    }

    if (!appUser) {
      console.log('❌ User not found in app_user table');
      console.log('================================\n');

      throw new UnauthorizedException('Perfil de usuario no encontrado');
    }

    console.log('✅ app_user found');
    console.log('Role:', appUser.global_role);
    console.log('Email:', appUser.email);
    console.log('================================\n');

    request.appUser = appUser;

    return true;
  }

  private extractBearerToken(authorizationHeader?: string): string | null {
    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}

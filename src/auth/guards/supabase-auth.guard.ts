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

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (appUserError) {
      throw new UnauthorizedException('Unable to load app_user profile');
    }

    if (!appUser) {
      throw new UnauthorizedException('app_user profile not found');
    }

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

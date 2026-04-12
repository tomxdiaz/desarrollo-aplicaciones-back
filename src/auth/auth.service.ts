import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async signIn(email: string, password: string): Promise<string> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data.session || !data.session.access_token) {
      throw new InternalServerErrorException('No access token returned');
    }

    return data.session.access_token;
  }

  async signUp(email: string, password: string): Promise<string> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data.session || !data.session.access_token) {
      throw new InternalServerErrorException('No access token returned');
    }

    return data.session.access_token;
  }
}

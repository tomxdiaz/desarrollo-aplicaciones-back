import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { ApiTags } from '@nestjs/swagger';
import { SignUpDto } from './dto/sign-up.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto): Promise<string> {
    return await this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto): Promise<string> {
    return await this.authService.signUp(signUpDto.email, signUpDto.password);
  }
}

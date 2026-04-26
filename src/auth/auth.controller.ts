import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignUpDto } from './dto/sign-up.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @ApiOperation({ summary: 'Iniciar sesión' })
  async signIn(
    @Body() signInDto: SignInDto,
  ): Promise<{ access_token: string }> {
    const access_token = await this.authService.signIn(
      signInDto.email,
      signInDto.password,
    );
    return { access_token };
  }

  @Post('sign-up')
  @ApiOperation({ summary: 'Registrar un nuevo usuario con rol global USER' })
  async signUp(@Body() signUpDto: SignUpDto): Promise<{ message: string }> {
    const message = await this.authService.signUp(
      signUpDto.email,
      signUpDto.password,
    );
    return { message };
  }
}

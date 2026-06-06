import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { RefreshGuard } from '../guards/refresh.guard';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
export interface JwtUser {
  userId: string;
  email: string;
  roles: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);

    return {
      message: 'User registered successfully',
      data: result,
    };
  }

  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    return {
      message: 'User logged in successfully',
      data: result,
    };
  }
  @SkipThrottle()
  @UseGuards(RefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@CurrentUser() user: JwtUser) {
    const result = await this.authService.refreshTokens(
      user.userId,
      user.email,
      user.roles,
    );
    return {
      message: 'Tokens refreshed successfully',
      data: result,
    };
  }
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: JwtUser) {
    await this.authService.logout(user.userId);
    return {
      message: 'User logged out successfully',
    };
  }
  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body('idToken') idToken: string) {
    const result = await this.authService.googleLogin(idToken);
    return { message: 'Google login successful', data: result };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: JwtUser) {
    const result = await this.authService.getProfile(user.userId);
    return {
      message: 'User profile retrieved successfully',
      data: result,
    };
  }

  @Throttle({ auth: { ttl: 60000, limit: 20 } })
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body('email') email: string) {
    const result = await this.authService.sendVerificationOtp(email);
    return result;
  }

  @Throttle({ auth: { ttl: 60000, limit: 20 } })
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body('email') email: string, @Body('otp') otp: string) {
    const result = await this.authService.verifyEmail(email, otp);
    return result;
  }

  @Throttle({ auth: { ttl: 60000, limit: 20 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    const result = await this.authService.sendForgotPasswordOtp(email);
    return result;
  }

  @Throttle({ auth: { ttl: 60000, limit: 20 } })
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  async verifyResetOtp(@Body('email') email: string, @Body('otp') otp: string) {
    const result = await this.authService.verifyForgotPasswordOtp(email, otp);
    return result;
  }

  @Throttle({ auth: { ttl: 60000, limit: 20 } })
  @Patch('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('resetToken') resetToken: string,
    @Body('password') password: string,
  ) {
    const result = await this.authService.resetPassword(resetToken, password);
    return result;
  }
}

import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Res,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { RefreshGuard } from '../guards/refresh.guard';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Response } from 'express';

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

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    // sameSite: 'none' is required for cross-domain cookies in production
    // (frontend on vercel.app, backend on onrender.com)
    const sameSite = isProduction ? 'none' : 'strict';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }

  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto);
    if (result.accessToken && result.refreshToken) {
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
    }
    const { accessToken, refreshToken, ...safeData } = result;
    return {
      message: 'User registered successfully',
      data: safeData,
    };
  }

  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    const { accessToken, refreshToken, ...safeData } = result;
    return {
      message: 'User logged in successfully',
      data: safeData,
    };
  }

  @SkipThrottle()
  @UseGuards(RefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@CurrentUser() user: JwtUser, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshTokens(
      user.userId,
      user.email,
      user.roles,
    );
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      message: 'Tokens refreshed successfully',
    };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: JwtUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.userId);
    this.clearAuthCookies(res);
    return {
      message: 'User logged out successfully',
    };
  }

  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body('idToken') idToken: string, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.googleLogin(idToken);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    const { accessToken, refreshToken, ...safeData } = result;
    return { message: 'Google login successful', data: safeData };
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

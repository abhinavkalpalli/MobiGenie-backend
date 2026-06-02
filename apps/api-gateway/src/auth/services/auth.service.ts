import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import fetch from 'node-fetch';
import {
  AlreadyExistsException,
  ResourceNotFoundException,
  UnauthorizedAccessException,
} from '@app/common';
import { UserRepository } from '../repositories/user.repository';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { MetricsService } from '../../metrics/metrics.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {}
  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new AlreadyExistsException('Email');
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
    });
    const userId = (user._id as { toString(): string }).toString();
    const tokens = await this.generateTokens(
      userId,
      user.email as string,
      user.role as string,
    );

    await this.userRepository.updateRefreshToken(userId, tokens.refreshToken);
    this.metricsService.recordAuthEvent('register');

    return {
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }
  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new ResourceNotFoundException('User');
    }
    if (!user.password) {
      throw new UnauthorizedAccessException(
        'This account uses Google sign-in. Please continue with Google.',
      );
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedAccessException('Invalid credentials');
    }
    const userId = (user._id as { toString(): string }).toString();
    const tokens = await this.generateTokens(
      userId,
      user.email as string,
      user.role as string,
    );

    await this.userRepository.updateRefreshToken(userId, tokens.refreshToken);
    this.metricsService.recordAuthEvent('login');
    return {
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }
  async refreshTokens(userId: string, email: string, role: string) {
    const tokens = await this.generateTokens(userId, email, role);
    await this.userRepository.updateRefreshToken(userId, tokens.refreshToken);
    return tokens;
  }
  async logout(userId: string) {
    await this.userRepository.updateRefreshToken(userId, null);
    this.metricsService.recordAuthEvent('logout');
    return { message: 'Logged out successfully' };
  }
  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundException('User');
    }
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
  async googleLogin(accessToken: string) {
    // Verify access token by fetching user info from Google
    let googleId: string, email: string, name: string, email_verified: boolean;
    try {
      const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch user info');
      const info = (await res.json()) as {
        sub: string;
        email: string;
        name: string;
        email_verified: boolean;
      };
      googleId = info.sub;
      email = info.email;
      name = info.name;
      email_verified = info.email_verified;
    } catch {
      throw new UnauthorizedAccessException('Invalid Google token');
    }

    if (!email)
      throw new UnauthorizedAccessException('Google account has no email');
    if (!email)
      throw new UnauthorizedAccessException('Google account has no email');

    // Find existing user by googleId or email
    let user = await this.userRepository.findByGoogleId(googleId!);

    if (!user) {
      user = await this.userRepository.findByEmail(email);
      if (user) {
        // Link Google to existing email account
        const uid = (user._id as { toString(): string }).toString();
        user = await this.userRepository.linkGoogleId(
          uid,
          googleId,
          email_verified ?? true,
        );
      } else {
        // Create new account
        user = await this.userRepository.create({
          name: name ?? email.split('@')[0],
          email,
          password: null,
          googleId,
          isVerified: email_verified ?? true,
        });
      }
    }

    if (!user)
      throw new UnauthorizedAccessException(
        'Failed to authenticate with Google',
      );

    const userId = (user._id as { toString(): string }).toString();
    const tokens = await this.generateTokens(
      userId,
      user.email as string,
      user.role as string,
    );
    await this.userRepository.updateRefreshToken(userId, tokens.refreshToken);
    this.metricsService.recordAuthEvent('login');

    return {
      user: { id: userId, name: user.name, email: user.email, role: user.role },
      ...tokens,
    };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN') as number,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') as number,
      }),
    ]);
    return { accessToken, refreshToken };
  }
}

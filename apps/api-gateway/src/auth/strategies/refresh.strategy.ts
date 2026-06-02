import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') ?? '',
      passReqToCallback: true,
    });
  }

  async validate(req: { headers: { authorization?: string } }, payload: any) {
    const refreshToken = req.headers.authorization
      ?.replace('Bearer ', '')
      .trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    const user = await this.userRepository.findByRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.role,
      refreshToken,
    };
  }
}

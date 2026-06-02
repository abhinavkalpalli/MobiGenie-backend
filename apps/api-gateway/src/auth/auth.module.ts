import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UserRepository } from './repositories/user.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { User, UserSchema } from '@app/database';
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    JwtStrategy,
    RefreshStrategy,
    JwtAuthGuard,
    RefreshGuard,
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}

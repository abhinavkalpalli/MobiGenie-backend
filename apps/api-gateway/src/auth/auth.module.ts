import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { AuthController } from './controllers/auth.controller';
import { AdminController } from './controllers/admin.controller';
import { AuthService } from './services/auth.service';
import { MailService } from './services/mail.service';
import { UserRepository } from './repositories/user.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import { User, UserSchema } from '@app/database';
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController, AdminController],
  providers: [
    AuthService,
    MailService,
    UserRepository,
    JwtStrategy,
    RefreshStrategy,
    JwtAuthGuard,
    RefreshGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from '@app/database';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { PhonesModule } from './phones/phones.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
      { name: 'auth', ttl: 60000, limit: 10 }, // 10 auth requests per minute
      { name: 'default', ttl: 60000, limit: 100 }, // 100 req/min for everything else
    ]),
    AuthModule,
    DatabaseModule,
    MetricsModule,
    PhonesModule,
    ChatModule,
    HealthModule,
  ],
  controllers: [ApiGatewayController],
  providers: [
    ApiGatewayService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: MetricsInterceptor,
    },
  ],
})
export class ApiGatewayModule {}

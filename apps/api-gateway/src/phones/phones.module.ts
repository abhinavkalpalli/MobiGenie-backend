import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Reflector } from '@nestjs/core';
import { PhonesController } from './controllers/phones.controller';
import { PhonesService } from './services/phones.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PHONE_QUEUE } from '@app/common';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: PHONE_QUEUE,
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              process.env.RABBITMQ_URI ||
                'amqp://admin:password@localhost:5672',
            ],
            queue: process.env.RABBITMQ_PHONE_QUEUE || 'phone_queue',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [PhonesController],
  providers: [PhonesService, RolesGuard, Reflector],
  exports: [PhonesService],
})
export class PhonesModule {}

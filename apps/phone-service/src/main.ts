import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PhoneServiceModule } from './phone-service.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('PhoneService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PhoneServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          process.env.RABBITMQ_URI || 'amqp://admin:password@localhost:5672',
        ],
        queue: process.env.RABBITMQ_PHONE_QUEUE || 'phone_queue',
        queueOptions: { durable: true },
      },
    },
  );

  await app.listen();
  logger.log('🚀 Phone Service is listening for messages...');
}
void bootstrap();

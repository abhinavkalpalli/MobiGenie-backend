import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { QueryServiceModule } from './query-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    QueryServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          process.env.RABBITMQ_URI || 'amqp://admin:password@localhost:5672',
        ],
        queue: process.env.RABBITMQ_QUERY_QUEUE || 'query_queue',
        queueOptions: { durable: true },
      },
    },
  );

  await app.listen();
  console.log('🚀 Query Service running');
}
void bootstrap();

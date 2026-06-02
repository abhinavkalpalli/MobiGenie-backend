import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AiServiceModule } from './ai-service.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('AiService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AiServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          process.env.RABBITMQ_URI || 'amqp://admin:password@localhost:5672',
        ],
        queue: process.env.RABBITMQ_AI_QUEUE || 'ai_queue',
        queueOptions: { durable: true },
        noAck: false,
      },
    },
  );

  await app.listen();
  logger.log('🤖 AI Service running on ai_queue');
}
void bootstrap();

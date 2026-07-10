import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AiServiceModule } from './ai-service.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('AiService');

  const app = await NestFactory.create(AiServiceModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URI || 'amqp://admin:password@localhost:5672'],
      queue: process.env.RABBITMQ_AI_QUEUE || 'ai_queue',
      queueOptions: { durable: true },
      noAck: false,
      socketOptions: { heartbeatIntervalInSeconds: 30 },
    },
  });

  await app.startAllMicroservices();
  const port = process.env.PORT || 3002;
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  await app.listen(port);
  logger.log(`AI Service running on port ${port}`);
}
void bootstrap();

import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CombinedModule } from './combined.module';

async function bootstrap() {
  const app = await NestFactory.create(CombinedModule);

  // Query service queue
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URI || 'amqp://admin:password@localhost:5672'],
      queue: process.env.RABBITMQ_QUERY_QUEUE || 'query_queue',
      queueOptions: { durable: true },
      socketOptions: { heartbeatIntervalInSeconds: 30 },
    },
  });

  // Phone service queue
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URI || 'amqp://admin:password@localhost:5672'],
      queue: process.env.RABBITMQ_PHONE_QUEUE || 'phone_queue',
      queueOptions: { durable: true },
      socketOptions: { heartbeatIntervalInSeconds: 30 },
    },
  });

  await app.startAllMicroservices();
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Combined Query+Phone Service running on port ${port}`);
}
void bootstrap();

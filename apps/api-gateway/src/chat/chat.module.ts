import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { QUERY_QUEUE, PHONE_QUEUE, AI_QUEUE } from '@app/common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    ClientsModule.registerAsync([
      // ─── Query Service Client ───────────────
      {
        name: QUERY_QUEUE,
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              process.env.RABBITMQ_URI ||
                'amqp://admin:password@localhost:5672',
            ],
            queue: process.env.RABBITMQ_QUERY_QUEUE || 'query_queue',
            queueOptions: { durable: true },
          },
        }),
      },

      // ─── Phone Service Client ───────────────
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
      // ─── AI Service Client ───────────────

      {
        name: AI_QUEUE,
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              process.env.RABBITMQ_URI ||
                'amqp://admin:password@localhost:5672',
            ],
            queue: process.env.RABBITMQ_AI_QUEUE || 'ai_queue',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

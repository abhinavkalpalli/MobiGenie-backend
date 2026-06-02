import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({})
export class RabbitmqModule {
  static register(queueName: string): DynamicModule {
    return {
      module: RabbitmqModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name: queueName,
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [configService.get<string>('RABBITMQ_URI')!],
                queue: queueName,
                queueOptions: {
                  durable: true,
                },
              },
            }),
            inject: [ConfigService],
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}

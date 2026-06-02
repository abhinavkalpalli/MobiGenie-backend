import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './controllers/ai.controller';
import { AiService } from './services/ai.service';
import { RagService } from './services/rag.service';
import { LlmService } from './services/llm.service';
import { EmbeddingService } from './services/embedding.service';
import { EmbeddingRepository } from './repositories/embedding.repository';
import { PhoneEmbedding, PhoneEmbeddingSchema, Phone, PhoneSchema } from '@app/database';
import { TensorflowModule } from '../tensorflow/tensorflow.module';
import { PhoneIndexBootstrap } from './services/phone-index.bootstrap';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: PhoneEmbedding.name, schema: PhoneEmbeddingSchema },
      { name: Phone.name, schema: PhoneSchema },
    ]),
    TensorflowModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    RagService,
    LlmService,
    EmbeddingService,
    EmbeddingRepository,
    PhoneIndexBootstrap,
  ],
  exports: [AiService],
})
export class AiModule {}

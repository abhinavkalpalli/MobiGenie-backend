import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './controllers/ai.controller';
import { AiService } from './services/ai.service';
import { RagService } from './services/rag.service';
import { LlmService } from './services/llm.service';
import { EmbeddingService } from './services/embedding.service';
import { EmbeddingRepository } from './repositories/embedding.repository';
import { Phone, PhoneSchema } from '@app/database';
import { TensorflowModule } from '../tensorflow/tensorflow.module';
import { PhoneIndexBootstrap } from './services/phone-index.bootstrap';
import { PineconeModule } from './pinecone/pinecone.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Phone.name, schema: PhoneSchema }]),
    TensorflowModule,
    PineconeModule,
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

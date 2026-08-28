import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PineconeProvider } from './pinecone.provider';

@Module({
  imports: [ConfigModule],
  providers: [PineconeProvider],
  exports: [PineconeProvider],
})
export class PineconeModule {}

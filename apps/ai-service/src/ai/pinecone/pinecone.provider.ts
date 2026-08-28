import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone, type Index } from '@pinecone-database/pinecone';
import { EMBEDDING_DIMENSIONS } from '../services/embedding.service';

@Injectable()
export class PineconeProvider implements OnModuleInit {
  private readonly logger = new Logger(PineconeProvider.name);
  private client!: Pinecone;
  private indexName!: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const apiKey = this.configService.getOrThrow<string>('PINECONE_API_KEY');
    this.indexName = this.configService.get<string>(
      'PINECONE_INDEX_NAME',
      'phone-embeddings',
    );
    const cloud = this.configService.get<string>('PINECONE_CLOUD', 'aws');
    const region = this.configService.get<string>(
      'PINECONE_REGION',
      'us-east-1',
    );

    this.client = new Pinecone({ apiKey });

    const existing = await this.client.listIndexes();
    const alreadyExists = existing.indexes?.some(
      (i) => i.name === this.indexName,
    );

    if (!alreadyExists) {
      this.logger.log(`Creating Pinecone index "${this.indexName}"...`);
      await this.client.createIndex({
        name: this.indexName,
        dimension: EMBEDDING_DIMENSIONS,
        metric: 'cosine',
        spec: { serverless: { cloud: cloud as 'aws', region } },
        waitUntilReady: true,
      });
      this.logger.log(`✅ Pinecone index "${this.indexName}" ready`);
    } else {
      this.logger.log(`Pinecone index "${this.indexName}" already exists`);
    }
  }

  getIndex(): Index {
    return this.client.index(this.indexName);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PineconeProvider } from '../pinecone/pinecone.provider';
import { EMBEDDING_MODEL } from '../services/embedding.service';

interface PhoneEmbeddingMetadata {
  phoneName: string;
  embeddingText: string;
  embeddingModel: string;
  [key: string]: string;
}

@Injectable()
export class EmbeddingRepository {
  private readonly logger = new Logger(EmbeddingRepository.name);

  constructor(private readonly pineconeProvider: PineconeProvider) {}

  async savePhoneEmbedding(
    phoneId: string,
    phoneName: string,
    embeddingText: string,
    embedding: number[],
  ): Promise<void> {
    await this.pineconeProvider.getIndex().upsert({
      records: [
        {
          id: phoneId,
          values: embedding,
          metadata: {
            phoneName,
            embeddingText,
            embeddingModel: EMBEDDING_MODEL,
          } satisfies PhoneEmbeddingMetadata,
        },
      ],
    });
  }

  async findSimilar(
    queryEmbedding: number[],
    limit: number = 5,
  ): Promise<{ phoneId: string; score: number }[]> {
    const results = await this.pineconeProvider.getIndex().query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: false,
    });

    return (results.matches ?? []).map((match) => ({
      phoneId: match.id,
      score: match.score ?? 0,
    }));
  }

  async findByPhoneId(
    phoneId: string,
  ): Promise<{ phoneId: string; metadata?: PhoneEmbeddingMetadata } | null> {
    const result = await this.pineconeProvider
      .getIndex()
      .fetch({ ids: [phoneId] });
    const record = result.records?.[phoneId];
    if (!record) return null;

    return {
      phoneId,
      metadata: record.metadata as unknown as PhoneEmbeddingMetadata,
    };
  }

  async countIndexed(): Promise<number> {
    const stats = await this.pineconeProvider.getIndex().describeIndexStats();
    return stats.totalRecordCount ?? 0;
  }
}

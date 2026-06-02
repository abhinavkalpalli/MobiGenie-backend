import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { EmbeddingRepository } from '../repositories/embedding.repository';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly embeddingRepository: EmbeddingRepository,
  ) {}

  // Index all phones (run once / when phones are added)
  async indexPhones(phones: { _id: unknown; name: string }[]): Promise<void> {
    this.logger.log(`Indexing ${phones.length} phones...`);

    for (const phone of phones) {
      try {
        // Build text representation
        const embeddingText =
          this.embeddingService.buildPhoneEmbeddingText(phone);

        // Generate embedding
        const embedding = this.embeddingService.embedText(embeddingText);

        // Save to DB
        await this.embeddingRepository.savePhoneEmbedding(
          String(phone._id),
          phone.name,
          embeddingText,
          embedding,
        );

        this.logger.log(`✅ Indexed: ${phone.name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to index ${phone.name}: ${message}`);
      }
    }

    this.logger.log('✅ All phones indexed!');
  }

  // Find most relevant phones for a query
  async findRelevantPhones(
    query: string,
    limit: number = 5,
  ): Promise<{ phoneId: string; score: number }[]> {
    this.logger.log(`RAG search for: "${query}"`);

    // Embed the query
    const queryEmbedding = this.embeddingService.embedText(query);

    // Find similar phones
    const similar = await this.embeddingRepository.findSimilar(
      queryEmbedding,
      limit,
    );

    this.logger.log(`Found ${similar.length} relevant phones via RAG`);

    return similar;
  }
}

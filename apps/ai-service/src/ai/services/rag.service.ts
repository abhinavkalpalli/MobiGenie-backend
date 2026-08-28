import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Phone, PhoneDocument } from '@app/database';
import { EmbeddingService } from './embedding.service';
import { EmbeddingRepository } from '../repositories/embedding.repository';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly embeddingRepository: EmbeddingRepository,
    @InjectModel(Phone.name) private readonly phoneModel: Model<PhoneDocument>,
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
        const embedding = await this.embeddingService.embedText(embeddingText);

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
    const queryEmbedding = await this.embeddingService.embedText(query);

    // Find similar phones
    const similar = await this.embeddingRepository.findSimilar(
      queryEmbedding,
      limit,
    );

    this.logger.log(`Found ${similar.length} relevant phones via RAG`);

    return similar;
  }

  // Vector search against a pre-computed embedding (used by the raw RPC endpoint)
  async findSimilarByEmbedding(
    embedding: number[],
    limit: number = 5,
  ): Promise<{ phoneId: string; score: number }[]> {
    return this.embeddingRepository.findSimilar(embedding, limit);
  }

  // Find relevant phones and return full documents, ready for the LLM prompt
  async findRelevantPhoneDocs(query: string, limit: number = 5): Promise<any[]> {
    const similar = await this.findRelevantPhones(query, limit);
    if (similar.length === 0) return [];

    const phoneIds = similar.map((s) => s.phoneId);
    const docs = await this.phoneModel
      .find({ _id: { $in: phoneIds } })
      .lean()
      .exec();

    // Preserve RAG's similarity ranking (Mongo doesn't guarantee $in order)
    const docsById = new Map(docs.map((d) => [String(d._id), d]));
    return similar
      .map((s) => docsById.get(s.phoneId))
      .filter((d): d is NonNullable<typeof d> => d !== undefined);
  }
}

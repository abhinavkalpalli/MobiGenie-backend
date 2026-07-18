import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BaseRepository,
  PhoneEmbedding,
  PhoneEmbeddingDocument,
} from '@app/database';
import { EmbeddingService } from '../services/embedding.service';

@Injectable()
export class EmbeddingRepository extends BaseRepository<PhoneEmbedding> {
  private static readonly VECTOR_INDEX_NAME = 'phone_embedding_vector_index';
  private readonly logger = new Logger(EmbeddingRepository.name);

  constructor(
    @InjectModel('PhoneEmbedding') model: Model<PhoneEmbeddingDocument>,
    private readonly embeddingService: EmbeddingService,
  ) {
    super(model);
  }

  async savePhoneEmbedding(
    phoneId: string,
    phoneName: string,
    embeddingText: string,
    embedding: number[],
  ): Promise<PhoneEmbeddingDocument> {
    const existing = await this.model.findOne({ phoneId }).exec();

    if (existing) {
      existing.embedding = embedding;
      existing.embeddingText = embeddingText;
      return existing.save();
    }

    return this.model.create({ phoneId, phoneName, embeddingText, embedding });
  }

  async findSimilar(
    queryEmbedding: number[],
    limit: number = 5,
  ): Promise<{ phoneId: string; score: number }[]> {
    try {
      return await this.findSimilarViaVectorSearch(queryEmbedding, limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Atlas $vectorSearch unavailable, falling back to brute-force: ${message}`,
      );
      return this.findSimilarBruteForce(queryEmbedding, limit);
    }
  }

  // Requires an Atlas Vector Search index named VECTOR_INDEX_NAME on the
  // `embedding` field (see docs/vector-search-index.json). Only works on
  // MongoDB Atlas — throws on self-hosted/local MongoDB, which the caller
  // catches and falls back to the brute-force scan below.
  private async findSimilarViaVectorSearch(
    queryEmbedding: number[],
    limit: number,
  ): Promise<{ phoneId: string; score: number }[]> {
    const results = await this.model.aggregate([
      {
        $vectorSearch: {
          index: EmbeddingRepository.VECTOR_INDEX_NAME,
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: Math.max(limit * 20, 100),
          limit,
        },
      },
      {
        $project: {
          _id: 0,
          phoneId: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    return results as { phoneId: string; score: number }[];
  }

  private async findSimilarBruteForce(
    queryEmbedding: number[],
    limit: number,
  ): Promise<{ phoneId: string; score: number }[]> {
    const allEmbeddings = await this.model.find().exec();

    return allEmbeddings
      .map((doc) => ({
        phoneId: doc.phoneId.toString(),
        score: this.embeddingService.cosineSimilarity(
          queryEmbedding,
          doc.embedding as number[],
        ),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  findByPhoneId(phoneId: string): Promise<PhoneEmbeddingDocument | null> {
    return this.model.findOne({ phoneId }).exec();
  }
}

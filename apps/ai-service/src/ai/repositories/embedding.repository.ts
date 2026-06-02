import { Injectable } from '@nestjs/common';
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

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Phone, PhoneDocument } from '@app/database';
import { RagService } from './rag.service';
import { EmbeddingRepository } from '../repositories/embedding.repository';
import { EMBEDDING_MODEL } from './embedding.service';

@Injectable()
export class PhoneIndexBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(PhoneIndexBootstrap.name);

  constructor(
    @InjectModel(Phone.name) private readonly phoneModel: Model<PhoneDocument>,
    private readonly ragService: RagService,
    private readonly embeddingRepository: EmbeddingRepository,
  ) {}

  async onApplicationBootstrap() {
    try {
      const totalPhones = await this.phoneModel.countDocuments().exec();
      if (totalPhones === 0) {
        this.logger.log('No phones in DB — skipping index');
        return;
      }

      const indexedCount = await this.embeddingRepository.countIndexed();

      if (indexedCount >= totalPhones) {
        this.logger.log(
          `PhoneEmbedding already up-to-date for ${EMBEDDING_MODEL} (${indexedCount}/${totalPhones})`,
        );
        return;
      }

      this.logger.log(
        `Indexing phones with ${EMBEDDING_MODEL}: ${indexedCount} up-to-date, ${totalPhones} total`,
      );

      const phones = await this.phoneModel.find().lean().exec();
      await this.ragService.indexPhones(phones as any);

      this.logger.log(`✅ Phone indexing complete (${phones.length} phones)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Phone index bootstrap failed: ${message}`);
    }
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { FeatureExtractionPipeline } from '@xenova/transformers';

export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_DIMENSIONS = 384;

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private embedder: FeatureExtractionPipeline | null = null;
  private loadingPromise: Promise<FeatureExtractionPipeline> | null = null;

  async onModuleInit() {
    // Warm the model at boot so the first real request isn't the one paying
    // the download/load cost.
    await this.getEmbedder();
  }

  private async getEmbedder(): Promise<FeatureExtractionPipeline> {
    if (this.embedder) return this.embedder;
    if (!this.loadingPromise) {
      this.logger.log(`Loading embedding model: ${EMBEDDING_MODEL}...`);
      const { pipeline } = await import('@xenova/transformers');
      this.loadingPromise = pipeline('feature-extraction', EMBEDDING_MODEL).then(
        (p) => {
          this.embedder = p as FeatureExtractionPipeline;
          this.logger.log('✅ Embedding model ready');
          return this.embedder;
        },
      );
    }
    return this.loadingPromise;
  }

  // Real semantic embedding via a trained sentence-transformer model
  // (all-MiniLM-L6-v2, 384 dimensions, runs locally — no external API call)
  async embedText(text: string): Promise<number[]> {
    const embedder = await this.getEmbedder();
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array);
  }

  // Build embedding text for a phone
  buildPhoneEmbeddingText(phone: any): string {
    return `
      ${phone.name} ${phone.brand}
      price ${phone.price?.current} rupees
      ${phone.specs?.ram}GB RAM
      ${phone.specs?.storage}GB storage
      ${phone.specs?.battery?.capacity}mAh battery
      ${phone.specs?.battery?.charging}W charging
      ${phone.specs?.camera?.rear?.main}MP camera
      ${phone.specs?.display?.refreshRate}Hz display
      ${phone.specs?.connectivity?.network}
      ${phone.specs?.processor}
      ${phone.tags?.join(' ')}
    `
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Cosine similarity
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] ?? 0), 0);
    const magnitudeA = Math.sqrt(
      vecA.reduce((sum: number, a: number) => sum + a * a, 0),
    );
    const magnitudeB = Math.sqrt(
      vecB.reduce((sum: number, b: number) => sum + b * b, 0),
    );
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

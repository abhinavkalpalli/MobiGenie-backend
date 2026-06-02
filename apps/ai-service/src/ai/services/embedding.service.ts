import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  // Simple local embedding using TF-IDF style
  // (no API needed)
  embedText(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const vector: number[] = new Array<number>(128).fill(0);

    words.forEach((word, index) => {
      const hash = this.hashWord(word);
      vector[hash % 128] += 1 / (index + 1);
    });

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));

    return magnitude > 0 ? vector.map((v) => v / magnitude) : vector;
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

  // Simple hash function
  private hashWord(word: string): number {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

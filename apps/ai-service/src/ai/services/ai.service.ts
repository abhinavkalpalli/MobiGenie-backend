import { Injectable, Logger } from '@nestjs/common';
import { RagService } from './rag.service';
import { LlmService } from './llm.service';
import { EmbeddingService } from './embedding.service';
import { buildSuggestionPrompt } from '../prompts/suggestion.prompt';
import { ISuggestRequest, ISuggestResponse, ISuggestStreamRequest } from '../interfaces/ai.interface';
import { ClassifierService } from '../../tensorflow/services/classifier.service';
import type { Channel } from 'amqplib';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly ragService: RagService,
    private readonly llmService: LlmService,
    private readonly embeddingService: EmbeddingService,
    private readonly classifierService: ClassifierService,
  ) {}

  // ─── Main Suggest Method ─────────────────────
  async suggest(request: ISuggestRequest): Promise<ISuggestResponse> {
    this.logger.log(`Generating suggestion for: "${request.query}"`);

    try {
      const classification = await this.classifierService.classify(
        request.query,
      );

      this.logger.log(
        `TF Classification: ${classification.category} ` +
          `(${(classification.confidence * 100).toFixed(1)}%)`,
      );

      const enhancedFilters = {
        ...request.parsedFilters,
        intentCategory: classification.category,
        intentTags: classification.tags,
        confidence: classification.confidence,
      };

      // Step 1 — Use provided phones OR find via RAG
      let phonesToUse = request.phones;

      if (!phonesToUse || phonesToUse.length === 0) {
        this.logger.log('No phones provided — using RAG search');
        phonesToUse = await this.ragService.findRelevantPhoneDocs(
          request.query,
          5,
        );
        this.logger.log(`RAG found ${phonesToUse.length} relevant phones`);
      }

      // Step 2 — Build prompt
      const prompt = buildSuggestionPrompt(
        request.query,
        phonesToUse,
        enhancedFilters,
      );

      // Step 3 — Generate response
      const { text, tokensUsed } = await this.llmService.generate(prompt);

      // Step 4 — Extract recommended phone IDs
      const recommendedIds = phonesToUse
        .slice(0, 3)
        .map((p: any) => p._id?.toString() || p.id);

      this.logger.log(`✅ Suggestion generated (${tokensUsed} tokens)`);

      return {
        text,
        recommendedIds,
        tokensUsed,
        classification: {
          category: classification.category,
          confidence: classification.confidence,
          tags: classification.tags,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Suggestion failed: ${message}`);

      // Fallback response if LLM fails
      return {
        text: this.buildFallbackResponse(request.query, request.phones),
        recommendedIds: request.phones.slice(0, 3).map((p: any) => p._id),
        tokensUsed: 0,
      };
    }
  }

  // ─── Streaming Suggest (chunks → reply queue) ─
  async suggestStream(
    request: ISuggestStreamRequest,
    channel: Channel,
  ): Promise<void> {
    this.logger.log(`Streaming suggestion for: "${request.query}"`);

    try {
      const classification = await this.classifierService.classify(request.query);

      const enhancedFilters = {
        ...request.parsedFilters,
        intentCategory: classification.category,
        intentTags: classification.tags,
        confidence: classification.confidence,
      };

      let phonesToUse = request.phones?.length ? request.phones : [];

      if (phonesToUse.length === 0) {
        this.logger.log('No phones provided — using RAG search');
        phonesToUse = await this.ragService.findRelevantPhoneDocs(
          request.query,
          5,
        );
        this.logger.log(`RAG found ${phonesToUse.length} relevant phones`);
      }

      const prompt = buildSuggestionPrompt(request.query, phonesToUse, enhancedFilters);

      const recommendedIds = phonesToUse
        .slice(0, 3)
        .map((p: any) => p._id?.toString() || p.id);

      await this.llmService.generateStreamToQueue(
        prompt,
        request.replyTo,
        request.correlationId,
        channel,
        recommendedIds,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Stream suggestion failed: ${message}`);
      // Send error sentinel so gateway closes the SSE stream gracefully
      channel.sendToQueue(
        request.replyTo,
        Buffer.from(JSON.stringify({ error: true, done: true, recommendedIds: [] })),
        { correlationId: request.correlationId, contentType: 'application/json' },
      );
    }
  }

  // ─── Embed Text ──────────────────────────────
  async embed(text: string): Promise<number[]> {
    return this.embeddingService.embedText(text);
  }

  // ─── Index Phones ────────────────────────────
  async indexPhones(phones: { _id: unknown; name: string }[]): Promise<void> {
    return this.ragService.indexPhones(phones);
  }

  // ─── Vector Search ───────────────────────────
  async vectorSearch(embedding: number[], limit: number = 5) {
    return this.ragService['embeddingRepository'].findSimilar(embedding, limit);
  }

  // ─── Fallback Response ───────────────────────
  private buildFallbackResponse(query: string, phones: any[]): string {
    if (!phones || phones.length === 0) {
      return `Hi! I'm MobiGenie 🤖 — I help you find the right phone based on your budget, specs, or brand preferences. Tell me what you're looking for and I'll suggest some options!`;
    }

    const top3 = phones.slice(0, 3);
    const list = top3
      .map(
        (p, i) =>
          `${i + 1}. ${p.name} - ₹${p.price?.current?.toLocaleString()}`,
      )
      .join('\n');

    return `Here are my top picks for "${query}":\n\n${list}\n\nAll phones match your requirements!`;
  }
}

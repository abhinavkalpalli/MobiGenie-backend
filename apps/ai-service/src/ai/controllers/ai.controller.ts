import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { AiService } from '../services/ai.service';
import { ISuggestRequest, ISuggestStreamRequest } from '../interfaces/ai.interface';
import { AI_SUGGEST, AI_SUGGEST_STREAM, AI_EMBED, AI_VECTOR_SEARCH } from '@app/common';

@Controller()
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  // ════════════════════════════════════════════
  // MessagePattern — NEED response back
  // ════════════════════════════════════════════

  // Generate suggestion → returns AI text
  @MessagePattern(AI_SUGGEST)
  async suggest(@Payload() data: ISuggestRequest) {
    this.logger.log(`[MessagePattern] ${AI_SUGGEST}`);
    return this.aiService.suggest(data);
  }

  // Embed text → returns vector
  @MessagePattern(AI_EMBED)
  embed(@Payload() data: { text: string }) {
    this.logger.log(`[MessagePattern] ${AI_EMBED}`);
    return this.aiService.embed(data.text);
  }

  // Vector search → returns similar phones
  @MessagePattern(AI_VECTOR_SEARCH)
  async vectorSearch(@Payload() data: { embedding: number[]; limit?: number }) {
    this.logger.log(`[MessagePattern] ${AI_VECTOR_SEARCH}`);
    return this.aiService.vectorSearch(data.embedding, data.limit);
  }

  // Stream AI suggestion chunks to a reply queue
  @MessagePattern(AI_SUGGEST_STREAM)
  async suggestStream(
    @Payload() data: ISuggestStreamRequest,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`[MessagePattern] ${AI_SUGGEST_STREAM}`);
    const channel = context.getChannelRef();
    const msg = context.getMessage();
    // Ack immediately — chunks go directly to replyTo queue, no RPC response
    channel.ack(msg);
    void this.aiService.suggestStream(data, channel);
  }

  // ════════════════════════════════════════════
  // EventPattern — FIRE AND FORGET
  // ════════════════════════════════════════════

  // Index phones for RAG → no response needed
  @EventPattern('ai.index.phones')
  async indexPhones(
    @Payload() data: { phones: { _id: string; name: string }[] },
  ) {
    this.logger.log(`[EventPattern] ai.index.phones`);
    try {
      await this.aiService.indexPhones(data.phones);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Indexing failed: ${message}`);
    }
  }
}

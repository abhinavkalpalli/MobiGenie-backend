import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { Channel } from 'amqplib';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly llm: ChatGroq;

  constructor(private readonly configService: ConfigService) {
    this.llm = new ChatGroq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      maxTokens: 1000,
    });
  }

  // Generate response (non-streaming)
  async generate(prompt: string): Promise<{
    text: string;
    tokensUsed: number;
  }> {
    try {
      this.logger.log('Generating response via Groq...');

      const response = await this.llm.invoke([
        new SystemMessage(
          'You are MobiGenie, a helpful mobile phone advisor. ' +
            'Give concise, helpful recommendations.',
        ),
        new HumanMessage(prompt),
      ]);

      return {
        text: response.content as string,
        tokensUsed: response.usage_metadata?.total_tokens || 0,
      };
    } catch (error) {
      this.logger.error(
        `Groq generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // Stream chunks directly to a RabbitMQ reply queue
  async generateStreamToQueue(
    prompt: string,
    replyTo: string,
    correlationId: string,
    channel: Channel,
    recommendedIds: string[],
  ): Promise<void> {
    try {
      this.logger.log('Streaming response to reply queue...');
      const stream = await this.llm.stream([
        new SystemMessage(
          'You are MobiGenie, a helpful mobile phone advisor. ' +
            'Give concise, helpful recommendations.',
        ),
        new HumanMessage(prompt),
      ]);

      for await (const chunk of stream) {
        if (chunk.content) {
          channel.sendToQueue(
            replyTo,
            Buffer.from(JSON.stringify({ chunk: chunk.content as string })),
            { correlationId, contentType: 'application/json' },
          );
        }
      }

      // Sentinel: signals end-of-stream to the gateway
      channel.sendToQueue(
        replyTo,
        Buffer.from(JSON.stringify({ done: true, recommendedIds })),
        { correlationId, contentType: 'application/json' },
      );
    } catch (error) {
      this.logger.error(
        `Groq stream-to-queue failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Send error sentinel so gateway doesn't hang
      channel.sendToQueue(
        replyTo,
        Buffer.from(
          JSON.stringify({ error: true, done: true, recommendedIds: [] }),
        ),
        { correlationId, contentType: 'application/json' },
      );
    }
  }

  // Streaming response
  async *generateStream(prompt: string): AsyncGenerator<string> {
    try {
      this.logger.log('Streaming response via Groq...');

      const stream = await this.llm.stream([
        new SystemMessage(
          'You are MobiGenie, a helpful mobile phone advisor. ' +
            'Give concise, helpful recommendations.',
        ),
        new HumanMessage(prompt),
      ]);

      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content as string;
        }
      }
    } catch (error) {
      this.logger.error(
        `Groq streaming failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}

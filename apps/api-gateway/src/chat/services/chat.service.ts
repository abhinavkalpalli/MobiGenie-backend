import {
  Injectable,
  Inject,
  Logger,
  RequestTimeoutException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  firstValueFrom,
  timeout,
  catchError,
  TimeoutError,
  Observable,
} from 'rxjs';
import {
  QUERY_QUEUE,
  PHONE_QUEUE,
  QUERY_PARSE,
  QUERY_CLASSIFY,
  QUERY_HISTORY_SAVE,
  QUERY_HISTORY_GET,
  QUERY_SESSION_CREATE,
  QUERY_SESSION_LIST,
  QUERY_LOG_SAVE,
  PHONE_FIND_BY_SPECS,
  PHONE_FIND_BY_BUDGET,
  AI_QUEUE,
  AI_SUGGEST,
  AI_SUGGEST_STREAM,
} from '@app/common';
import { ChatQueryDto, CreateSessionDto } from '../dto/chat-query.dto';
import { MessageEvent } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(QUERY_QUEUE as string)
    private readonly queryClient: ClientProxy,

    @Inject(PHONE_QUEUE as string)
    private readonly phoneClient: ClientProxy,

    @Inject(AI_QUEUE as string)
    private readonly aiClient: ClientProxy,

    private readonly configService: ConfigService,
  ) {}

  // ─── Helper: MessagePattern (waits for response) ─
  private async send<T>(
    client: ClientProxy,
    pattern: unknown,
    data: unknown,
  ): Promise<T> {
    return firstValueFrom(
      client.send<T>(pattern, data).pipe(
        timeout(10000),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            throw new RequestTimeoutException(`Timeout: ${String(pattern)}`);
          }
          throw err;
        }),
      ),
    );
  }

  // ─── Helper: EventPattern (fire and forget) ───
  private emit(client: ClientProxy, pattern: unknown, data: unknown): void {
    client.emit(pattern, data);
    this.logger.log(`[Emitted] ${String(pattern)}`);
  }

  // ════════════════════════════════════════════
  // Main Process Query
  // ════════════════════════════════════════════
  async processQuery(dto: ChatQueryDto, userId: string) {
    this.logger.log(`Processing: "${dto.query}"`);
    const startTime = Date.now();

    // ─── Step 1: Parse query ─────────────────
    let parsed: any;
    try {
      parsed = await this.send(this.queryClient, QUERY_PARSE, {
        rawQuery: dto.query,
      });
      this.logger.log(`Parsed: ${JSON.stringify(parsed)}`);
    } catch (err) {
      this.logger.error(
        `Query parse failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new InternalServerErrorException('Failed to parse query');
    }

    // ─── Step 2: Find phones (isolated — failure returns empty) ──
    let phonesResult: any = { phones: [], count: 0 };
    try {
      const hasSpecs =
        parsed.ram ||
        parsed.battery ||
        parsed.camera ||
        parsed.network ||
        parsed.brand ||
        parsed.storage;

      if (parsed.maxPrice || parsed.minPrice) {
        if (hasSpecs) {
          phonesResult = await this.send(
            this.phoneClient,
            PHONE_FIND_BY_SPECS,
            {
              maxPrice: parsed.maxPrice,
              minPrice: parsed.minPrice,
              ram: parsed.ram,
              battery: parsed.battery,
              camera: parsed.camera,
              network: parsed.network,
              brand: parsed.brand,
              storage: parsed.storage,
            },
          );
        } else {
          phonesResult = await this.send(
            this.phoneClient,
            PHONE_FIND_BY_BUDGET,
            {
              maxPrice: parsed.maxPrice,
              minPrice: parsed.minPrice || 0,
            },
          );
        }
      } else if (hasSpecs) {
        phonesResult = await this.send(this.phoneClient, PHONE_FIND_BY_SPECS, {
          ram: parsed.ram,
          battery: parsed.battery,
          camera: parsed.camera,
          network: parsed.network,
          brand: parsed.brand,
          storage: parsed.storage,
        });
      }
    } catch (err) {
      this.logger.warn(
        `Phone lookup failed, returning empty results: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const responseTimeMs = Date.now() - startTime;

    // ─── Step 3: Get AI Suggestion — Fire and forget — save history ─
    let aiSuggestion: {
      text?: string;
      recommendedIds?: string[];
    } | null = null;
    try {
      aiSuggestion = await this.send<{
        text?: string;
        recommendedIds?: string[];
      }>(this.aiClient, AI_SUGGEST, {
        query: dto.query,
        parsedFilters: parsed,
        phones: phonesResult.phones || [],
        userId,
      });
    } catch (error) {
      this.logger.error(
        `AI suggestion failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Continue without AI if it fails
    }

    if (dto.sessionId) {
      this.emit(this.queryClient, QUERY_HISTORY_SAVE, {
        sessionId: dto.sessionId,
        userId,
        role: 'user',
        content: dto.query,
        parsedQuery: parsed,
      });

      this.emit(this.queryClient, QUERY_HISTORY_SAVE, {
        sessionId: dto.sessionId,
        userId,
        role: 'assistant',
        content:
          aiSuggestion?.text ||
          `Found ${phonesResult.count || 0} phones matching your query`,
        suggestedPhones: (phonesResult.phones || [])
          .slice(0, 10)
          .map((p: any) => ({
            phoneId: p._id,
            name: p.name,
            price: p.price?.current,
            image: p.image,
            matchScore: 1.0,
          })),
      });
    }

    // ─── Step 4: Fire and forget — save log ─────
    this.emit(this.queryClient, QUERY_LOG_SAVE, {
      userId,
      sessionId: dto.sessionId,
      rawQuery: dto.query,
      parsedFilters: parsed,
      queryType: parsed.queryType,
      responseTimeMs,
      phonesFound: phonesResult.count || 0,
      status: 'success',
    });

    return {
      parsed,
      phones: phonesResult.phones || [],
      totalFound: phonesResult.count || 0,
      aiSuggestion: aiSuggestion?.text || null,
      recommendedIds: aiSuggestion?.recommendedIds || [],
      responseTimeMs,
    };
  }

  // ════════════════════════════════════════════
  // SSE Streaming Query
  // ════════════════════════════════════════════
  streamQuery(dto: ChatQueryDto, userId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let connection: amqplib.ChannelModel | null = null;
      let channel: amqplib.Channel | null = null;
      let replyQueue: string | null = null;

      const run = async () => {
        // Step 1: Parse query
        let parsed: any;
        try {
          parsed = await this.send(this.queryClient, QUERY_PARSE, {
            rawQuery: dto.query,
          });
        } catch {
          subscriber.error(
            new InternalServerErrorException('Failed to parse query'),
          );
          return;
        }

        // Step 2: Find phones
        let phonesResult: any = { phones: [], count: 0 };
        try {
          const hasSpecs =
            parsed.ram ||
            parsed.battery ||
            parsed.camera ||
            parsed.network ||
            parsed.brand ||
            parsed.storage;

          if (parsed.maxPrice || parsed.minPrice) {
            phonesResult = await this.send(
              this.phoneClient,
              hasSpecs ? PHONE_FIND_BY_SPECS : PHONE_FIND_BY_BUDGET,
              hasSpecs
                ? {
                    maxPrice: parsed.maxPrice,
                    minPrice: parsed.minPrice,
                    ram: parsed.ram,
                    battery: parsed.battery,
                    camera: parsed.camera,
                    network: parsed.network,
                    brand: parsed.brand,
                    storage: parsed.storage,
                  }
                : { maxPrice: parsed.maxPrice, minPrice: parsed.minPrice || 0 },
            );
          } else if (hasSpecs) {
            phonesResult = await this.send(
              this.phoneClient,
              PHONE_FIND_BY_SPECS,
              {
                ram: parsed.ram,
                battery: parsed.battery,
                camera: parsed.camera,
                network: parsed.network,
                brand: parsed.brand,
                storage: parsed.storage,
              },
            );
          }
        } catch (err) {
          this.logger.warn(
            `Phone lookup failed in stream: ${err instanceof Error ? err.message : String(err)}`,
          );
        }

        // Step 3: Open a raw amqplib connection for the reply queue
        const rmqUri =
          this.configService.get<string>('RABBITMQ_URI') ||
          'amqp://admin:1234@localhost:5672';
        connection = await amqplib.connect(rmqUri);
        channel = await connection.createChannel();

        const correlationId = randomUUID();
        const q = await channel.assertQueue('', {
          exclusive: true,
          autoDelete: true,
          durable: false,
        });
        replyQueue = q.queue;

        // Step 4a: Emit phones immediately before AI starts streaming
        subscriber.next({
          data: {
            phones: phonesResult.phones || [],
            totalFound: phonesResult.count || 0,
            parsed,
          },
        });

        // Step 4b: Publish stream request to ai_queue
        channel.sendToQueue(
          'ai_queue',
          Buffer.from(
            JSON.stringify({
              pattern: AI_SUGGEST_STREAM,
              data: {
                query: dto.query,
                parsedFilters: parsed,
                phones: phonesResult.phones || [],
                userId,
                replyTo: replyQueue,
                correlationId,
              },
            }),
          ),
          { contentType: 'application/json' },
        );

        // Step 5: Consume chunks from the reply queue and push to SSE
        let fullAssistantText = '';

        await channel.consume(
          replyQueue,
          (msg) => {
            if (!msg) return;
            try {
              const payload = JSON.parse(msg.content.toString());
              if (payload.chunk) {
                fullAssistantText += payload.chunk;
                subscriber.next({
                  data: { chunk: payload.chunk },
                });
              }
              if (payload.done) {
                subscriber.next({
                  data: {
                    done: true,
                    recommendedIds: payload.recommendedIds ?? [],
                  },
                });
                // Save both user and assistant messages fire-and-forget
                if (dto.sessionId) {
                  this.emit(this.queryClient, QUERY_HISTORY_SAVE, {
                    sessionId: dto.sessionId,
                    userId,
                    role: 'user',
                    content: dto.query,
                    parsedQuery: parsed,
                  });
                  this.emit(this.queryClient, QUERY_HISTORY_SAVE, {
                    sessionId: dto.sessionId,
                    userId,
                    role: 'assistant',
                    content:
                      fullAssistantText ||
                      `Found ${phonesResult.count || 0} phones matching your query`,
                    suggestedPhones: (phonesResult.phones || [])
                      .slice(0, 10)
                      .map((p: any) => ({
                        phoneId: p._id,
                        name: p.name,
                        price: p.price?.current,
                        image: p.image,
                        matchScore: 1.0,
                      })),
                  });
                }
                subscriber.complete();
              }
            } catch {
              subscriber.complete();
            }
          },
          { noAck: true },
        );
      };

      run().catch((err) => subscriber.error(err));

      // Cleanup on client disconnect
      return () => {
        void channel?.close().catch(() => {});
        void connection?.close().catch(() => {});
      };
    });
  }

  // ════════════════════════════════════════════
  // Other Methods (MessagePattern — need response)
  // ════════════════════════════════════════════

  async parseQuery(rawQuery: string) {
    return this.send(this.queryClient, QUERY_PARSE, { rawQuery });
  }

  async classifyQuery(rawQuery: string) {
    return this.send(this.queryClient, QUERY_CLASSIFY, { rawQuery });
  }

  async createSession(userId: string, dto: CreateSessionDto) {
    return this.send(this.queryClient, QUERY_SESSION_CREATE, {
      userId,
      title: dto.title || 'New Chat',
    });
  }

  async getUserSessions(userId: string) {
    return this.send(this.queryClient, QUERY_SESSION_LIST, { userId });
  }

  async getSessionMessages(sessionId: string) {
    return this.send(this.queryClient, QUERY_HISTORY_GET, { sessionId });
  }
}

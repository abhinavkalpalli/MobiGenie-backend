import { Injectable, Logger } from '@nestjs/common';
import { QueryParserService } from './query-parser.service';
import { QueryClassifierService } from './query-classifier.service';
import { QueryLogRepository } from '../repositories/query-log.repository';
import { ParsedQuery } from '../interfaces/parsed-query.interface';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(
    private readonly parser: QueryParserService,
    private readonly classifier: QueryClassifierService,
    private readonly logRepo: QueryLogRepository,
  ) {}

  // ─── Parse Query ─────────────────────────────
  parseQuery(rawQuery: string): ParsedQuery {
    this.logger.log(`Parsing: "${rawQuery}"`);
    return this.parser.parse(rawQuery);
  }

  // ─── Classify Query ───────────────────────────
  classifyQuery(rawQuery: string) {
    return {
      isComparison: this.classifier.isComparison(rawQuery),
      isBestPhone: this.classifier.isBestPhone(rawQuery),
      isGaming: this.classifier.isGaming(rawQuery),
      isCameraFocused: this.classifier.isCameraFocused(rawQuery),
      intentTags: this.classifier.getIntentTags(rawQuery),
    };
  }

  // ─── Parse + Classify Together ───────────────
  processQuery(data: {
    rawQuery: string;
    userId?: string;
    sessionId?: string;
  }) {
    const startTime = Date.now();

    const parsed = this.parser.parse(data.rawQuery);
    const classified = {
      isComparison: this.classifier.isComparison(data.rawQuery),
      isBestPhone: this.classifier.isBestPhone(data.rawQuery),
      isGaming: this.classifier.isGaming(data.rawQuery),
      isCameraFocused: this.classifier.isCameraFocused(data.rawQuery),
      intentTags: this.classifier.getIntentTags(data.rawQuery),
    };

    const responseTimeMs = Date.now() - startTime;

    // Log is isolated — DB failure never breaks the main response
    if (data.userId) {
      this.logRepo
        .create({
          userId: data.userId,
          sessionId: data.sessionId,
          rawQuery: data.rawQuery,
          parsedFilters: parsed,
          queryType: parsed.queryType,
          responseTimeMs,
          status: 'success',
        } as any)
        .catch((err: unknown) => {
          this.logger.warn(
            `Query log save failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    }

    return {
      parsed,
      classified,
      responseTimeMs,
    };
  }

  // ─── Save Query Log ───────────────────────────
  saveLog(data: {
    userId?: string;
    sessionId?: string;
    rawQuery: string;
    parsedFilters: any;
    queryType: string;
    responseTimeMs: number;
    phonesFound: number;
    status: string;
    errorMessage?: string;
  }) {
    return this.logRepo.create(data as any).catch((err: unknown) => {
      this.logger.warn(
        `saveLog failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }
}

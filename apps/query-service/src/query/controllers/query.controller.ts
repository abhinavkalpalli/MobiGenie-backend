import { Controller, Logger } from '@nestjs/common';
import {
  MessagePattern,
  EventPattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { QueryService } from '../services/query.service';
import { HistoryService } from '../../history/services/history.service';
import {
  QUERY_PARSE,
  QUERY_CLASSIFY,
  QUERY_HISTORY_SAVE,
  QUERY_HISTORY_GET,
  QUERY_SESSION_CREATE,
  QUERY_SESSION_LIST,
  QUERY_LOG_SAVE,
} from '@app/common';

const errMsg = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

@Controller()
export class QueryController {
  private readonly logger = new Logger(QueryController.name);

  constructor(
    private readonly queryService: QueryService,
    private readonly historyService: HistoryService,
  ) {}

  // ════════════════════════════════════════════
  // MessagePattern — NEED response back
  // ════════════════════════════════════════════

  @MessagePattern(QUERY_PARSE)
  parseQuery(@Payload() data: { rawQuery: string }) {
    this.logger.log(`[MessagePattern] ${QUERY_PARSE}`);
    try {
      return this.queryService.parseQuery(data.rawQuery);
    } catch (err) {
      this.logger.error(`${QUERY_PARSE} failed: ${errMsg(err)}`);
      throw new RpcException(errMsg(err));
    }
  }

  @MessagePattern(QUERY_CLASSIFY)
  classifyQuery(@Payload() data: { rawQuery: string }) {
    this.logger.log(`[MessagePattern] ${QUERY_CLASSIFY}`);
    try {
      return this.queryService.classifyQuery(data.rawQuery);
    } catch (err) {
      this.logger.error(`${QUERY_CLASSIFY} failed: ${errMsg(err)}`);
      throw new RpcException(errMsg(err));
    }
  }

  @MessagePattern(QUERY_SESSION_CREATE)
  async createSession(@Payload() data: { userId: string; title?: string }) {
    this.logger.log(`[MessagePattern] ${QUERY_SESSION_CREATE}`);
    try {
      return await this.historyService.createSession(data.userId, data.title);
    } catch (err) {
      this.logger.error(`${QUERY_SESSION_CREATE} failed: ${errMsg(err)}`);
      throw new RpcException(errMsg(err));
    }
  }

  @MessagePattern(QUERY_SESSION_LIST)
  async getUserSessions(@Payload() data: { userId: string }) {
    this.logger.log(`[MessagePattern] ${QUERY_SESSION_LIST}`);
    try {
      return await this.historyService.getUserSessions(data.userId);
    } catch (err) {
      this.logger.error(`${QUERY_SESSION_LIST} failed: ${errMsg(err)}`);
      throw new RpcException(errMsg(err));
    }
  }

  @MessagePattern(QUERY_HISTORY_GET)
  async getSessionMessages(@Payload() data: { sessionId: string }) {
    this.logger.log(`[MessagePattern] ${QUERY_HISTORY_GET}`);
    try {
      return await this.historyService.getSessionMessages(data.sessionId);
    } catch (err) {
      this.logger.error(`${QUERY_HISTORY_GET} failed: ${errMsg(err)}`);
      throw new RpcException(errMsg(err));
    }
  }

  // ════════════════════════════════════════════
  // EventPattern — FIRE AND FORGET
  // ════════════════════════════════════════════

  @EventPattern(QUERY_HISTORY_SAVE)
  async saveMessage(
    @Payload()
    data: {
      sessionId: string;
      userId: string;
      role: 'user' | 'assistant';
      content: string;
      suggestedPhones?: any[];
      parsedQuery?: any;
    },
  ) {
    this.logger.log(`[EventPattern] ${QUERY_HISTORY_SAVE}`);
    try {
      await this.historyService.saveMessage(data);
    } catch (err) {
      this.logger.error(`Failed to save message: ${errMsg(err)}`);
    }
  }

  @EventPattern(QUERY_LOG_SAVE)
  async saveLog(
    @Payload()
    data: {
      userId?: string;
      sessionId?: string;
      rawQuery: string;
      parsedFilters: any;
      queryType: string;
      responseTimeMs: number;
      phonesFound: number;
      status: string;
      errorMessage?: string;
    },
  ) {
    this.logger.log(`[EventPattern] ${QUERY_LOG_SAVE}`);
    try {
      await this.queryService.saveLog(data);
    } catch (err) {
      this.logger.error(`Failed to save log: ${errMsg(err)}`);
    }
  }
}

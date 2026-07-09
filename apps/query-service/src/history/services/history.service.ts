import { Injectable, Logger } from '@nestjs/common';
import { ChatSessionRepository } from '../repositories/chat-session.repository';
import { ChatMessageRepository } from '../repositories/chat-message.repository';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    private readonly sessionRepo: ChatSessionRepository,
    private readonly messageRepo: ChatMessageRepository,
  ) {}

  // Create new chat session
  createSession(userId: string, title: string = 'New Chat') {
    return this.sessionRepo.create({ userId, title } as any);
  }

  // Get all sessions for user
  getUserSessions(userId: string) {
    return this.sessionRepo.findByUserId(userId);
  }

  // Save a message
  async saveMessage(data: {
    sessionId: string;
    userId: string;
    role: 'user' | 'assistant';
    content: string;
    suggestedPhones?: any[];
    parsedQuery?: any;
  }) {
    const message = await this.messageRepo.create(data as any);

    // Title tracks the latest user message — assistant replies don't rename the chat
    const title =
      data.role === 'user'
        ? data.content.length > 30
          ? data.content.substring(0, 30) + '...'
          : data.content
        : undefined;

    // Session count update is best-effort — failure must not lose the message
    this.sessionRepo
      .incrementMessageCount(
        data.sessionId,
        data.content.substring(0, 100),
        title,
      )
      .catch((err: unknown) => {
        this.logger.warn(
          `incrementMessageCount failed for session ${data.sessionId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });

    return message;
  }

  // Get messages for a session
  async getSessionMessages(sessionId: string) {
    return this.messageRepo.findBySessionId(sessionId);
  }

  // Get user chat history
  async getUserHistory(userId: string) {
    const sessions = await this.sessionRepo.findByUserId(userId);
    return sessions;
  }
}

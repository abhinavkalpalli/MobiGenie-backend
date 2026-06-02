import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryService } from './services/history.service';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import {
  ChatSession,
  ChatSessionSchema,
  ChatMessage,
  ChatMessageSchema,
  Phone,
  PhoneSchema,
} from '@app/database';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: Phone.name, schema: PhoneSchema },
    ]),
  ],
  providers: [HistoryService, ChatSessionRepository, ChatMessageRepository],
  exports: [HistoryService],
})
export class HistoryModule {}

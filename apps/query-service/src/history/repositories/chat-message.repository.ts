import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@app/database';
import { ChatMessage, ChatMessageDocument } from '@app/database';

@Injectable()
export class ChatMessageRepository extends BaseRepository<ChatMessage> {
  constructor(
    @InjectModel('ChatMessage')
    private readonly messageModel: Model<ChatMessageDocument>,
  ) {
    super(messageModel);
  }

  findBySessionId(sessionId: string): Promise<ChatMessageDocument[]> {
    return this.messageModel
      .find({ sessionId })
      .populate('suggestedPhones.phoneId')
      .sort({ createdAt: 1 })
      .exec();
  }

  findByUserId(userId: string, limit = 50): Promise<ChatMessageDocument[]> {
    return this.messageModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}

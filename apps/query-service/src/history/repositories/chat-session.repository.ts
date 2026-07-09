import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@app/database';
import { ChatSession, ChatSessionDocument } from '@app/database';

@Injectable()
export class ChatSessionRepository extends BaseRepository<ChatSession> {
  constructor(
    @InjectModel('ChatSession')
    private readonly sessionModel: Model<ChatSessionDocument>,
  ) {
    super(sessionModel);
  }

  async findByUserId(userId: string): Promise<ChatSessionDocument[]> {
    return this.sessionModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async incrementMessageCount(
    sessionId: string,
    lastMessage: string,
    title?: string,
  ) {
    return this.sessionModel
      .findByIdAndUpdate(
        sessionId,
        {
          $inc: { messageCount: 1 },
          lastMessage: { content: lastMessage, at: new Date() },
          ...(title ? { title } : {}),
        },
        { new: true },
      )
      .exec();
  }
}

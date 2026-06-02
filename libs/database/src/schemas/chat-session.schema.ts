import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatSessionDocument = HydratedDocument<ChatSession>;

@Schema({ timestamps: true })
export class ChatSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ default: 'New Chat' })
  title!: string;

  @Prop({ default: 'active', enum: ['active', 'closed'] })
  status!: string;

  @Prop({ default: 0 })
  messageCount!: number;

  @Prop({
    type: {
      content: String,
      at: Date,
    },
    default: null,
  })
  lastMessage!: {
    content: string;
    at: Date;
  };
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
ChatSessionSchema.index({ userId: 1 });
ChatSessionSchema.index({ createdAt: -1 });

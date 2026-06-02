import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'ChatSession', required: true })
  sessionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: ['user', 'assistant'] })
  role!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({
    type: [
      {
        phoneId: { type: Types.ObjectId, ref: 'Phone' },
        name: String,
        price: Number,
        image: String,
        matchScore: Number,
      },
    ],
    default: [],
  })
  suggestedPhones!: {
    phoneId: Types.ObjectId;
    name: string;
    price: number;
    image: string;
    matchScore: number;
  }[];

  @Prop({
    type: {
      budget: Number,
      ram: Number,
      battery: Number,
      camera: Number,
      storage: Number,
      brand: String,
      network: String,
      queryType: String,
    },
    default: null,
  })
  parsedQuery!: {
    budget: number;
    ram: number;
    battery: number;
    camera: number;
    storage: number;
    brand: string;
    network: string;
    queryType: string;
  };
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ sessionId: 1 });
ChatMessageSchema.index({ userId: 1 });
ChatMessageSchema.index({ createdAt: -1 });

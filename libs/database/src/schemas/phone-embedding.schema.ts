import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PhoneEmbeddingDocument = HydratedDocument<PhoneEmbedding>;

@Schema({ timestamps: true })
export class PhoneEmbedding {
  @Prop({ required: true })
  phoneId!: string;

  @Prop({ required: true })
  phoneName!: string;

  @Prop({ required: true })
  embeddingText!: string;

  @Prop({ type: [Number], required: true })
  embedding!: number[];

  @Prop({ default: 'text-embedding-ada-002' })
  embeddingModel!: string;
}

export const PhoneEmbeddingSchema =
  SchemaFactory.createForClass(PhoneEmbedding);

PhoneEmbeddingSchema.index({ phoneId: 1 });

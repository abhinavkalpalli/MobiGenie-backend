import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QueryLogDocument = HydratedDocument<QueryLog>;

@Schema({ timestamps: true })
export class QueryLog {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ChatSession' })
  sessionId!: Types.ObjectId;

  @Prop({ required: true })
  rawQuery!: string;

  @Prop({ type: Object, default: {} })
  parsedFilters!: Record<string, any>;

  @Prop({ default: 'general' })
  queryType!: string;

  @Prop({ default: 0 })
  responseTimeMs!: number;

  @Prop({ default: 0 })
  phonesFound!: number;

  @Prop({
    default: 'success',
    enum: ['success', 'failed', 'no_results'],
  })
  status!: string;

  @Prop({ default: null })
  errorMessage!: string;
}

export const QueryLogSchema = SchemaFactory.createForClass(QueryLog);
QueryLogSchema.index({ userId: 1 });
QueryLogSchema.index({ createdAt: -1 });

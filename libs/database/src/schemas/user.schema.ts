import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ type: String, default: null })
  password!: string | null;

  @Prop({ type: String, default: null, index: true, sparse: true })
  googleId!: string | null;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role!: string;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ type: String, default: null })
  refreshToken!: string | null;

  @Prop({ type: String, default: null })
  otp!: string | null;

  @Prop({ type: Date, default: null })
  otpExpiry!: Date | null;

  @Prop({ type: Number, default: 0 })
  tokenVersion!: number;

  @Prop({ type: Number, default: 0 })
  loginAttempts!: number;

  @Prop({ type: Date, default: null })
  lockUntil!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

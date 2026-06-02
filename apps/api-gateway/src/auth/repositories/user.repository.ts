import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository, Doc, User } from '@app/database';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {
    super(userModel);
  }

  async findByEmail(email: string): Promise<Doc<User> | null> {
    return this.userModel.findOne({ email }).exec() as Promise<Doc<User> | null>;
  }
  async updateRefreshToken(userId: string, refreshToken: string | null) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { refreshToken },
      { new: true },
    );
  }
  async findByRefreshToken(refreshToken: string): Promise<Doc<User> | null> {
    return this.userModel.findOne({ refreshToken }).exec() as Promise<Doc<User> | null>;
  }

  async findByGoogleId(googleId: string): Promise<Doc<User> | null> {
    return this.userModel.findOne({ googleId }).exec() as Promise<Doc<User> | null>;
  }

  async linkGoogleId(userId: string, googleId: string, isVerified: boolean): Promise<Doc<User> | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { googleId, isVerified },
      { new: true },
    ).exec() as Promise<Doc<User> | null>;
  }
}

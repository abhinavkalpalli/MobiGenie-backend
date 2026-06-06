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

  async findAllUsers(page: number = 1, limit: number = 20): Promise<{ data: Doc<User>[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find().select('-password -refreshToken').skip(skip).limit(limit).sort({ createdAt: -1 }).exec() as Promise<Doc<User>[]>,
      this.userModel.countDocuments().exec(),
    ]);
    return { data, total, page, limit };
  }

  async saveOtp(userId: string, otp: string, expiry: Date): Promise<Doc<User> | null> {
    return this.userModel.findByIdAndUpdate(userId, { otp, otpExpiry: expiry }, { new: true }).exec() as Promise<Doc<User> | null>;
  }

  async clearOtp(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { otp: null, otpExpiry: null }).exec();
  }

  async markVerified(userId: string): Promise<Doc<User> | null> {
    return this.userModel.findByIdAndUpdate(userId, { isVerified: true, otp: null, otpExpiry: null }, { new: true }).exec() as Promise<Doc<User> | null>;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<Doc<User> | null> {
    return this.userModel.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true }).exec() as Promise<Doc<User> | null>;
  }

  async updateRole(userId: string, role: string): Promise<Doc<User> | null> {
    return this.userModel.findByIdAndUpdate(userId, { role }, { new: true }).select('-password -refreshToken').exec() as Promise<Doc<User> | null>;
  }

  async deleteUser(userId: string): Promise<Doc<User> | null> {
    return this.userModel.findByIdAndDelete(userId).exec() as Promise<Doc<User> | null>;
  }

  async incrementTokenVersion(userId: string): Promise<number> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { new: true })
      .exec();
    return user?.tokenVersion ?? 0;
  }
}

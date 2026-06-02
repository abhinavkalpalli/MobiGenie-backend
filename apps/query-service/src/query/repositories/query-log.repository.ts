import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@app/database';
import { QueryLog, QueryLogDocument } from '@app/database';

@Injectable()
export class QueryLogRepository extends BaseRepository<QueryLog> {
  constructor(
    @InjectModel('QueryLog')
    private readonly queryLogModel: Model<QueryLogDocument>,
  ) {
    super(queryLogModel);
  }

  async getRecentLogs(userId: string, limit = 10) {
    return this.queryLogModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueryController } from './controllers/query.controller';
import { QueryService } from './services/query.service';
import { QueryParserService } from './services/query-parser.service';
import { QueryClassifierService } from './services/query-classifier.service';
import { QueryLogRepository } from './repositories/query-log.repository';
import { QueryLog, QueryLogSchema } from '@app/database';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QueryLog.name, schema: QueryLogSchema },
    ]),
    HistoryModule,
  ],
  controllers: [QueryController],
  providers: [
    QueryService,
    QueryParserService,
    QueryClassifierService,
    QueryLogRepository,
  ],
  exports: [QueryService],
})
export class QueryModule {}

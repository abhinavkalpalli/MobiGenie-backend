import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { QueryModule } from './query/query.module';
import { HistoryModule } from './history/history.module';
import { PhonesModule } from '../../phone-service/src/phones/phones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    QueryModule,
    HistoryModule,
    PhonesModule,
  ],
})
export class CombinedModule {}

import { Module } from '@nestjs/common';
import { ClassifierService } from './services/classifier.service';

@Module({
  providers: [ClassifierService],
  exports: [ClassifierService],
})
export class TensorflowModule {}

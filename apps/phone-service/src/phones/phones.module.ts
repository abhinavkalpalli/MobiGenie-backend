import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhoneController } from './controllers/phone.controller';
import { PhoneService } from './services/phone.service';
import { PhoneRepository } from './repositories/phone.repository';
import { Phone, PhoneSchema } from '@app/database';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Phone.name, schema: PhoneSchema }]),
  ],
  controllers: [PhoneController],
  providers: [PhoneService, PhoneRepository],
  exports: [PhoneService, PhoneRepository],
})
export class PhonesModule {}

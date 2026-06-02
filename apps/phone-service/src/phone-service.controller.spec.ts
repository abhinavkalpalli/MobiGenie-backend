import { Test, TestingModule } from '@nestjs/testing';
import { PhoneServiceController } from './phone-service.controller';
import { PhoneServiceService } from './phone-service.service';

describe('PhoneServiceController', () => {
  let phoneServiceController: PhoneServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PhoneServiceController],
      providers: [PhoneServiceService],
    }).compile();

    phoneServiceController = app.get<PhoneServiceController>(
      PhoneServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(phoneServiceController.getHello()).toBe('Hello World!');
    });
  });
});

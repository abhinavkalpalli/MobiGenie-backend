import { Controller, Get } from '@nestjs/common';
import { PhoneServiceService } from './phone-service.service';

@Controller()
export class PhoneServiceController {
  constructor(private readonly phoneServiceService: PhoneServiceService) {}

  @Get()
  getHello(): string {
    return this.phoneServiceService.getHello();
  }
}

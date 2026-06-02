import { Controller, Get } from '@nestjs/common';
import { QueryServiceService } from './query-service.service';

@Controller()
export class QueryServiceController {
  constructor(private readonly queryServiceService: QueryServiceService) {}

  @Get()
  getHello(): string {
    return this.queryServiceService.getHello();
  }
}

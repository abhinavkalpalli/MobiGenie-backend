import { Controller, Logger } from '@nestjs/common';
import { PhoneService } from '../services/phone.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FilterPhoneDto } from '../dto/filter-phone.dto';
import {
  PHONE_FIND_BY_BUDGET,
  PHONE_FIND_BY_SPECS,
  PHONE_FIND_BY_ID,
  PHONE_SEARCH,
  PHONE_COMPARE,
} from '@app/common';

@Controller()
export class PhoneController {
  private readonly logger = new Logger(PhoneController.name);
  constructor(private readonly phoneService: PhoneService) {}
  @MessagePattern(PHONE_FIND_BY_BUDGET)
  findByBudget(@Payload() data: { maxPrice: number; minPrice?: number }) {
    this.logger.log(
      `Received : ${PHONE_FIND_BY_BUDGET} with data: ${JSON.stringify(data)}`,
    );
    return this.phoneService.findByBudget(data.maxPrice, data.minPrice);
  }
  // Handle: phone.findBySpecs
  @MessagePattern(PHONE_FIND_BY_SPECS)
  findBySpecs(@Payload() data: FilterPhoneDto) {
    this.logger.log(`Message received: ${PHONE_FIND_BY_SPECS}`);
    return this.phoneService.findByFilters(data);
  }

  // Handle: phone.findById
  @MessagePattern(PHONE_FIND_BY_ID)
  findById(@Payload() data: { id: string }) {
    this.logger.log(`Message received: ${PHONE_FIND_BY_ID}`);
    return this.phoneService.findById(data.id);
  }

  // Handle: phone.search
  @MessagePattern(PHONE_SEARCH)
  search(@Payload() data: { keyword: string; limit?: number }) {
    this.logger.log(`Message received: ${PHONE_SEARCH}`);
    return this.phoneService.search(data.keyword, data.limit);
  }

  // Handle: phone.compare
  @MessagePattern(PHONE_COMPARE)
  compare(@Payload() data: { ids: string[] }) {
    this.logger.log(`Message received: ${PHONE_COMPARE}`);
    return this.phoneService.compare(data.ids);
  }
}

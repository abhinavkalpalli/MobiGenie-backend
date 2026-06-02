import {
  Injectable,
  Inject,
  Logger,
  RequestTimeoutException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, TimeoutError } from 'rxjs';
import {
  PHONE_QUEUE,
  PHONE_FIND_BY_BUDGET,
  PHONE_FIND_BY_SPECS,
  PHONE_FIND_BY_ID,
  PHONE_SEARCH,
  PHONE_COMPARE,
} from '@app/common';
import { FilterPhoneDto } from '../dto/filter-phone.dto';

const toHttpError = (err: unknown, context: string) => {
  if (err instanceof RequestTimeoutException) throw err;
  throw new InternalServerErrorException(
    `${context}: ${err instanceof Error ? err.message : String(err)}`,
  );
};

@Injectable()
export class PhonesService {
  private readonly logger = new Logger(PhonesService.name);
  constructor(
    @Inject(PHONE_QUEUE as string) private readonly phoneClient: ClientProxy,
  ) {}

  async findAll(filters: FilterPhoneDto) {
    this.logger.log(`Finding phones with filters: ${JSON.stringify(filters)}`);
    return firstValueFrom(
      this.phoneClient.send(PHONE_FIND_BY_SPECS, filters).pipe(
        timeout(5000),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            throw new RequestTimeoutException(
              'Phone service is taking too long to respond',
            );
          }
          toHttpError(err, 'findAll');
          throw err;
        }),
      ),
    );
  }

  async findByBudget(maxPrice: number, minPrice: number = 0) {
    this.logger.log(`Finding phones by budget: ₹${minPrice}-₹${maxPrice}`);
    return firstValueFrom(
      this.phoneClient.send(PHONE_FIND_BY_BUDGET, { maxPrice, minPrice }).pipe(
        timeout(10000),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            throw new RequestTimeoutException('Phone service timeout');
          }
          toHttpError(err, 'findByBudget');
          throw err;
        }),
      ),
    );
  }

  async findById(id: string) {
    this.logger.log(`Finding phone by id: ${id}`);
    return firstValueFrom(
      this.phoneClient.send(PHONE_FIND_BY_ID, { id }).pipe(
        timeout(10000),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            throw new RequestTimeoutException('Phone service timeout');
          }
          toHttpError(err, 'findById');
          throw err;
        }),
      ),
    );
  }

  async search(keyword: string, limit: number = 10) {
    this.logger.log(`Searching phones: "${keyword}"`);
    return firstValueFrom(
      this.phoneClient.send(PHONE_SEARCH, { keyword, limit }).pipe(
        timeout(10000),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            throw new RequestTimeoutException('Phone service timeout');
          }
          toHttpError(err, 'search');
          throw err;
        }),
      ),
    );
  }

  async compare(ids: string[]) {
    this.logger.log(`Comparing phones: ${ids.join(', ')}`);
    return firstValueFrom(
      this.phoneClient.send(PHONE_COMPARE, { ids }).pipe(
        timeout(10000),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            throw new RequestTimeoutException('Phone service timeout');
          }
          toHttpError(err, 'compare');
          throw err;
        }),
      ),
    );
  }
}

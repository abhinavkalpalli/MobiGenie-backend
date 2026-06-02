import { Injectable } from '@nestjs/common';

@Injectable()
export class PhoneServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}

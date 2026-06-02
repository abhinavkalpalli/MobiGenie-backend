import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.url.includes('/metrics')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((response: any) => {
        const { message, data, ...rest } = response ?? {};
        return {
          success: true,
          message: message || 'Success',
          data: data !== undefined ? data : rest,
          ...(data !== undefined ? rest : {}),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

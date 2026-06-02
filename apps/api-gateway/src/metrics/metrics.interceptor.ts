import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    const method = request.method;
    const path: string = request.route?.path ?? request.url;

    // Track active connection
    this.metricsService.incrementConnections();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = response.statusCode;

          this.metricsService.incrementRequest(method, path, statusCode);
          this.metricsService.recordDuration(method, path, duration);
          this.metricsService.decrementConnections();
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode: number =
            typeof error.status === 'number' ? error.status : 500;

          this.metricsService.incrementRequest(method, path, statusCode);
          this.metricsService.recordDuration(method, path, duration);
          this.metricsService.recordError(method, path, statusCode.toString());
          this.metricsService.decrementConnections();
        },
      }),
    );
  }
}

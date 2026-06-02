import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorBody = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).message
          : exceptionResponse,
      error:
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).error
          : 'Error',
    };
    this.logger.error(
      `${request.method} ${request.url} ${status} - ${JSON.stringify(errorBody.message)}`,
    );
    response.status(status).json(errorBody);
  }
}

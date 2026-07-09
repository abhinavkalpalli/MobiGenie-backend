import { HttpException, HttpStatus } from '@nestjs/common';

// When resource already exists
export class AlreadyExistsException extends HttpException {
  constructor(resource: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: `${resource} already exists`,
      },
      HttpStatus.CONFLICT,
    );
  }
}

// When resource not found
export class ResourceNotFoundException extends HttpException {
  constructor(resource: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: `${resource} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

// When user is not authorized
export class UnauthorizedAccessException extends HttpException {
  constructor(message = 'Unauthorized access') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'Unauthorized',
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

// When validation fails
export class ValidationFailedException extends HttpException {
  constructor(errors: string[]) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Validation Failed',
        message: errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

// When service is unavailable
export class ServiceUnavailableException extends HttpException {
  constructor(service: string) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'Service Unavailable',
        message: `${service} is currently unavailable`,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

// When a guest exceeds their session/message allowance
export class GuestLimitExceededException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'GuestLimitExceeded',
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

// When RabbitMQ microservice fails
export class MicroserviceException extends HttpException {
  constructor(message = 'Microservice error') {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Microservice Error',
        message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

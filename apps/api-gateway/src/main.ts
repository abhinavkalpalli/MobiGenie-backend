import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ApiGatewayModule } from './api-gateway.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AllExceptionsFilter } from './filters/all-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);
  const port = config.get<number>('API_GATEWAY_PORT') || 3000;

  // ─── Security Headers ────────────────────────
  app.use(helmet());

  // ─── Cookie Parser ───────────────────────────
  app.use(cookieParser());

  // ─── Global Validation ───────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      transform: true, // auto-transform types
      forbidNonWhitelisted: true, // throw on unknown fields
      exceptionFactory: (errors) => {
        const messages = errors.map((e) =>
          Object.values(e.constraints || {}).join(', '),
        );
        return new BadRequestException(messages); // ✅ proper HTTP exception
      },
    }),
  );

  // ─── Global Filters ──────────────────────────
  app.useGlobalFilters(
    new AllExceptionsFilter(), // ← catches unknown/unhandled errors
    new HttpExceptionFilter(), // ← catches HTTP exceptions first
  );

  // ─── Global Interceptors ─────────────────────
  app.useGlobalInterceptors(
    new LoggingInterceptor(), // ← logs every request
    new TransformInterceptor(), // ← standardizes response format
  );

  // ─── CORS ────────────────────────────────────
  const corsOrigin =
    config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3003';
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // required for httpOnly cookies
    allowedHeaders: 'Content-Type,Authorization',
  });

  // ─── Global Prefix ───────────────────────────
  app.setGlobalPrefix('api/v1', { exclude: ['/metrics', '/health'] });

  // ─── Swagger ─────────────────────────────────
  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MobiGenie API')
      .setDescription('Phone recommendation AI — REST API docs')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`📖 Swagger docs → http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`🚀 API Gateway running → http://localhost:${port}/api/v1`);
}
void bootstrap();

import { Global, Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [
    MetricsService,

    // Total requests counter
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    }),

    // Request duration histogram
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    }),

    // Active connections gauge
    makeGaugeProvider({
      name: 'http_active_connections',
      help: 'Number of active HTTP connections',
    }),

    // Auth events counter
    makeCounterProvider({
      name: 'auth_events_total',
      help: 'Total authentication events',
      labelNames: ['event'],
    }),

    // Error counter
    makeCounterProvider({
      name: 'http_errors_total',
      help: 'Total HTTP errors',
      labelNames: ['method', 'path', 'statusCode'],
    }),
  ],
  exports: [MetricsService],
})
export class MetricsModule {}

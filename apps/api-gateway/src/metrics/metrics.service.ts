import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    // Count total HTTP requests
    @InjectMetric('http_requests_total')
    private readonly requestCounter: Counter<string>,

    // Track response durations
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,

    // Track active connections
    @InjectMetric('http_active_connections')
    private readonly activeConnections: Gauge<string>,

    // Count auth events
    @InjectMetric('auth_events_total')
    private readonly authCounter: Counter<string>,

    // Count errors
    @InjectMetric('http_errors_total')
    private readonly errorCounter: Counter<string>,
  ) {}

  // Increment request count
  incrementRequest(method: string, path: string, status: number) {
    this.requestCounter.inc({
      method,
      path,
      status: status.toString(),
    });
  }

  // Record response time
  recordDuration(method: string, path: string, duration: number) {
    this.requestDuration.observe({ method, path }, duration);
  }

  // Track active connections
  incrementConnections() {
    this.activeConnections.inc();
  }

  decrementConnections() {
    this.activeConnections.dec();
  }

  // Track auth events
  recordAuthEvent(event: 'register' | 'login' | 'logout' | 'refresh') {
    this.authCounter.inc({ event });
  }

  // Track errors
  recordError(method: string, path: string, statusCode: string) {
    this.errorCounter.inc({ method, path, statusCode });
  }
}

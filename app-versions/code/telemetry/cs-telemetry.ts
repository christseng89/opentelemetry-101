import type { CsLogger } from './cs-loggers';
import type { CsMetrics } from './cs-metrics';
import type { CsTracer } from './cs-tracers';
import type { CsRedisFactory } from './cs-redis';

export interface CsTelemetry {
    metrics: CsMetrics;
    tracer: CsTracer;
    logger: CsLogger;
    redis: CsRedisFactory;
    shutdown(): Promise<void>;
}

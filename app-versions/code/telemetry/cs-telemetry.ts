import type { CsLogger } from './cs-loggers';
import type { CsMetrics } from './cs-metrics';
import type { CsTracer } from './cs-tracers';

export interface CsTelemetry {
    metrics: CsMetrics;
    tracer: CsTracer;
    logger: CsLogger;
    shutdown(): Promise<void>;
}

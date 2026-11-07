import type { CsTelemetry } from './cs-telemetry';
import { OpenTelemetryLogger } from './opentelemetry-logger';
import { OpenTelemetryMetrics } from './opentelemetry-metrics';
import { OpenTelemetryTracer } from './opentelemetry-tracer';

export function createOpenTelemetry(serviceName: string, shutdown: () => Promise<void>): CsTelemetry {
    return {
        metrics: new OpenTelemetryMetrics(serviceName),
        tracer: new OpenTelemetryTracer(serviceName),
        logger: new OpenTelemetryLogger(serviceName),
        shutdown,
    };
}

import type { Attributes, Span } from '@opentelemetry/api';

export type SpanOperation<T> = (span: Span) => Promise<T> | T;

export interface TelemetryLogger {
    debug(message: string, attributes?: Attributes): void;
    info(message: string, attributes?: Attributes): void;
    warn(message: string, attributes?: Attributes): void;
    error(message: string, error?: unknown, attributes?: Attributes): void;
}

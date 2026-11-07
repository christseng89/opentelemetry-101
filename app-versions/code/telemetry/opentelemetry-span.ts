import type { Span } from '@opentelemetry/api';
import type { CsAttributeValue, CsAttributes, CsSpan } from './cs-spans';

export class OpenTelemetrySpan implements CsSpan {
    constructor(private readonly span: Span) {
        const traceId = this.traceId();
        if (traceId) {
            this.span.setAttribute('telemetry.trace_id', traceId);
        }
    }

    traceId(): string | undefined {
        const traceId = this.span.spanContext().traceId;
        return traceId && traceId !== '00000000000000000000000000000000' ? traceId : undefined;
    }

    setAttribute(key: string, value: CsAttributeValue): void {
        this.span.setAttribute(key, value as never);
    }

    setAttributes(attributes: CsAttributes): void {
        this.span.setAttributes(attributes as never);
    }

    recordException(error: unknown): void {
        const exception = error instanceof Error ? error : new Error(String(error));
        this.span.recordException(exception);
    }

    end(): void {
        this.span.end();
    }

    get nativeSpan(): Span {
        return this.span;
    }
}

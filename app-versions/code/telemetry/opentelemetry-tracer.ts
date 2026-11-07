import { SpanStatusCode, trace, type Tracer } from '@opentelemetry/api';
import type { CsAttributes, CsSpan, CsSpanOperation } from './cs-spans';
import type { CsTracer } from './cs-tracers';
import { OpenTelemetrySpan } from './opentelemetry-span';

export class OpenTelemetryTracer implements CsTracer {
    private readonly tracer: Tracer;

    constructor(serviceName: string) {
        this.tracer = trace.getTracer(serviceName);
    }

    start(name: string, attributes?: CsAttributes): CsSpan {
        const span = this.tracer.startSpan(name, { attributes: attributes as never });
        return new OpenTelemetrySpan(span);
    }

    run<T>(name: string, operation: CsSpanOperation<T>, attributes?: CsAttributes): Promise<T> {
        return this.tracer.startActiveSpan(name, { attributes: attributes as never }, async (span) => {
            const csSpan = new OpenTelemetrySpan(span);
            try {
                csSpan.setAttributes(attributes ?? {});
                const result = await operation(csSpan);
                span.setStatus({ code: SpanStatusCode.OK });
                return result;
            } catch (error) {
                csSpan.recordException(error);
                span.setAttribute('error.type', error instanceof Error ? error.name : 'Error');
                span.setStatus({ code: SpanStatusCode.ERROR });
                throw error;
            } finally {
                span.end();
            }
        });
    }
}

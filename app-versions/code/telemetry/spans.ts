import { SpanStatusCode, type Span, type Tracer } from '@opentelemetry/api';
import type { Attributes } from '@opentelemetry/api';
import type { SpanOperation } from './types';

export class SpanManager {
    constructor(private readonly tracer: Tracer) {}

    run<T>(name: string, operation: SpanOperation<T>, attributes?: Attributes): Promise<T> {
        return this.tracer.startActiveSpan(name, { attributes }, async (span: Span) => {
            try {
                if (attributes) {
                    span.setAttributes(attributes);
                }
                const result = await operation(span);
                span.setStatus({ code: SpanStatusCode.OK });
                return result;
            } catch (error) {
                const exception = error instanceof Error ? error : new Error(String(error));
                span.recordException(exception);
                span.setAttribute('error.type', exception.name);
                span.setStatus({ code: SpanStatusCode.ERROR });
                throw error;
            } finally {
                span.end();
            }
        });
    }
}

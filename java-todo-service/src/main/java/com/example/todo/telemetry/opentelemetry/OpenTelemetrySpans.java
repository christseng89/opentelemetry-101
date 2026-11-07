package com.example.todo.telemetry.opentelemetry;

import com.example.todo.telemetry.CsSpans;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.context.Scope;

final class OpenTelemetrySpans implements CsSpans {
    private final Span span;
    private final Scope scope;

    OpenTelemetrySpans(Span span) {
        this.span = span;
        this.scope = span.makeCurrent();
        String traceId = span.getSpanContext().getTraceId();
        if (!traceId.equals("00000000000000000000000000000000")) {
            span.setAttribute("telemetry.trace_id", traceId);
        }
    }

    @Override
    public void setAttribute(String key, String value) {
        span.setAttribute(key, value);
    }

    @Override
    public void setAttribute(String key, long value) {
        span.setAttribute(key, value);
    }

    @Override
    public void setAttribute(String key, boolean value) {
        span.setAttribute(key, value);
    }

    @Override
    public void recordException(Throwable exception) {
        span.recordException(exception);
    }

    @Override
    public void markOk() {
        span.setStatus(StatusCode.OK);
    }

    @Override
    public void markError(String description) {
        span.setStatus(StatusCode.ERROR, description);
    }

    @Override
    public void close() {
        scope.close();
        span.end();
    }
}

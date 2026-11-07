package com.example.todo.telemetry.opentelemetry;

import com.example.todo.telemetry.CsSpans;
import com.example.todo.telemetry.CsTracers;
import com.example.todo.telemetry.CsAttributes;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.Span;

import java.util.Map;

final class OpenTelemetryTracers implements CsTracers {
    private final Tracer tracer;

    OpenTelemetryTracers(Tracer tracer) {
        this.tracer = tracer;
    }

    @Override
    public String currentTraceId() {
        String traceId = Span.current().getSpanContext().getTraceId();
        return traceId.equals("00000000000000000000000000000000") ? "" : traceId;
    }

    @Override
    public CsSpans start(String name, Map<String, ?> attributes) {
        var span = tracer.spanBuilder(name)
                .setAllAttributes(CsAttributes.from(attributes))
                .startSpan();
        return new OpenTelemetrySpans(span);
    }
}

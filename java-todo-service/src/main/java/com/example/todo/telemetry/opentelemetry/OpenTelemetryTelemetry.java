package com.example.todo.telemetry.opentelemetry;

import com.example.todo.telemetry.CsLoggers;
import com.example.todo.telemetry.CsTelemetry;
import com.example.todo.telemetry.CsTracers;
import io.opentelemetry.api.GlobalOpenTelemetry;

public final class OpenTelemetryTelemetry implements CsTelemetry {
    private final CsTracers tracers;
    private final CsLoggers loggers;

    public OpenTelemetryTelemetry(String instrumentationName) {
        var openTelemetry = GlobalOpenTelemetry.get();
        this.tracers = new OpenTelemetryTracers(openTelemetry.getTracer(instrumentationName));
        this.loggers = new OpenTelemetryLoggers(openTelemetry.getLogsBridge().get(instrumentationName));
    }

    @Override
    public CsTracers tracers() {
        return tracers;
    }

    @Override
    public CsLoggers loggers() {
        return loggers;
    }
}

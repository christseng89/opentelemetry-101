package com.example.todo.telemetry.opentelemetry;

import com.example.todo.telemetry.CsAttributes;
import com.example.todo.telemetry.CsLoggers;
import io.opentelemetry.api.logs.Logger;
import io.opentelemetry.api.logs.Severity;

import java.util.Map;

final class OpenTelemetryLoggers implements CsLoggers {
    private final Logger logger;

    OpenTelemetryLoggers(Logger logger) {
        this.logger = logger;
    }

    @Override
    public void info(String message, Map<String, ?> attributes) {
        logger.logRecordBuilder()
                .setSeverity(Severity.INFO)
                .setBody(message)
                .setAllAttributes(CsAttributes.from(attributes))
                .emit();
    }

    @Override
    public void error(String message, Throwable exception, Map<String, ?> attributes) {
        logger.logRecordBuilder()
                .setSeverity(Severity.ERROR)
                .setBody(message + ": " + exception.getMessage())
                .setAllAttributes(CsAttributes.from(attributes))
                .setAttribute("exception.type", exception.getClass().getName())
                .setAttribute("exception.message", String.valueOf(exception.getMessage()))
                .emit();
    }
}

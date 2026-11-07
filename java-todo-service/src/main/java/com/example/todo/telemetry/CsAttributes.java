package com.example.todo.telemetry;

import io.opentelemetry.api.common.Attributes;

import java.util.Map;

public final class CsAttributes {
    private CsAttributes() {
    }

    public static Attributes from(Map<String, ?> values) {
        var builder = Attributes.builder();
        values.forEach((key, value) -> {
            if (value instanceof String stringValue) {
                builder.put(key, stringValue);
            } else if (value instanceof Boolean booleanValue) {
                builder.put(key, booleanValue);
            } else if (value instanceof Long longValue) {
                builder.put(key, longValue);
            } else if (value instanceof Number numberValue) {
                builder.put(key, numberValue.longValue());
            }
        });
        return builder.build();
    }
}

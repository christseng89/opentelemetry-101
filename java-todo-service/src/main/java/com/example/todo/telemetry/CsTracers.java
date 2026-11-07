package com.example.todo.telemetry;

import java.util.Map;

public interface CsTracers {
    String currentTraceId();

    CsSpans start(String name, Map<String, ?> attributes);
}

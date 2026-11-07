package com.example.todo.telemetry;

import java.util.Map;

public interface CsLoggers {
    void info(String message, Map<String, ?> attributes);

    void error(String message, Throwable exception, Map<String, ?> attributes);
}

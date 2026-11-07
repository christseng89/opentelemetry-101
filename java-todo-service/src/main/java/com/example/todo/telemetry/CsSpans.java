package com.example.todo.telemetry;

public interface CsSpans extends AutoCloseable {
    void setAttribute(String key, String value);

    void setAttribute(String key, long value);

    void setAttribute(String key, boolean value);

    void recordException(Throwable exception);

    void markOk();

    void markError(String description);

    @Override
    void close();
}

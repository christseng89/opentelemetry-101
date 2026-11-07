package com.example.todo;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.todo.telemetry.CsTelemetry;
import com.example.todo.telemetry.CsSpans;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class TodoService {
    private static final TypeReference<List<TodoItem>> TODO_LIST_TYPE = new TypeReference<>() {};
    private static final String READ_CONFIGURED_TODOS = "read-configured-todos";
    private static final String APP_OPERATION = "app.operation";

    private final ObjectMapper objectMapper;
    private final TodoProperties properties;
    private final CsTelemetry telemetry;

    public TodoService(ObjectMapper objectMapper, TodoProperties properties, CsTelemetry telemetry) {
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.telemetry = telemetry;
    }

    public List<TodoItem> listTodos() {
        try (CsSpans span = telemetry.tracers().start("todo.config.read", java.util.Map.of(
                APP_OPERATION, READ_CONFIGURED_TODOS,
                "todo.source", "TODO_DATA_JSON"))) {
            try {
                List<TodoItem> configuredTodos = objectMapper.readValue(properties.dataJson(), TODO_LIST_TYPE);
                int maxItems = Math.clamp(properties.maxItems(), 1, 5);
                int returnedCount = configuredTodos.isEmpty()
                        ? 0
                        : ThreadLocalRandom.current().nextInt(1, Math.min(maxItems, configuredTodos.size()) + 1);

                List<TodoItem> todos = new ArrayList<>(configuredTodos);
                Collections.shuffle(todos, ThreadLocalRandom.current());
                todos = todos.subList(0, returnedCount);

                span.setAttribute("todo.available_count", configuredTodos.size());
                span.setAttribute("todo.returned_count", todos.size());
                span.setAttribute("todo.max_items", maxItems);
                span.setAttribute("todo.selection", "random");
                span.markOk();
                telemetry.loggers().info("Loaded configured Todo items", java.util.Map.of(
                        APP_OPERATION, READ_CONFIGURED_TODOS,
                        "todo.available_count", configuredTodos.size(),
                        "todo.returned_count", todos.size(),
                        "todo.max_items", maxItems));
                return todos;
            } catch (JsonProcessingException exception) {
                span.recordException(exception);
                span.setAttribute("error.type", exception.getClass().getName());
                span.markError("Invalid TODO_DATA_JSON");
                telemetry.loggers().error("Unable to load configured Todo items", exception, java.util.Map.of(
                        APP_OPERATION, READ_CONFIGURED_TODOS));
                throw new IllegalStateException("TODO_DATA_JSON must be a JSON array of todo objects", exception);
            }
        }
    }
}

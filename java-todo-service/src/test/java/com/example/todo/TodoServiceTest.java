package com.example.todo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.todo.telemetry.opentelemetry.OpenTelemetryTelemetry;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TodoServiceTest {
    @Test
    void returnsTodosFromConfiguredJson() {
        TodoService service = new TodoService(
                new ObjectMapper(),
                new TodoProperties("[{\"name\":\"one\"},{\"name\":\"two\"}]", 5),
                new OpenTelemetryTelemetry("test"));

        List<TodoItem> todos = service.listTodos();

        assertThat(todos)
                .hasSizeBetween(1, 2)
                .allSatisfy(todo -> assertThat(todo.name()).isIn("one", "two"));
    }

    @Test
    void rejectsInvalidConfiguredJson() {
        TodoService service = new TodoService(
                new ObjectMapper(),
                new TodoProperties("not-json", 5),
                new OpenTelemetryTelemetry("test"));

        assertThatThrownBy(service::listTodos)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("TODO_DATA_JSON");
    }

    @Test
    void returnsRandomNumberOfConfiguredTodosUpToFive() {
        String json = "[" + IntStream.rangeClosed(1, 100)
                .mapToObj(index -> "{\"name\":\"Todo " + index + "\"}")
                .reduce((left, right) -> left + "," + right)
                .orElseThrow() + "]";
        TodoService service = new TodoService(
                new ObjectMapper(),
                new TodoProperties(json, 5),
                new OpenTelemetryTelemetry("test"));

        for (int attempt = 0; attempt < 20; attempt++) {
            List<TodoItem> todos = service.listTodos();
            assertThat(todos).hasSizeBetween(1, 5);
        }
    }
}

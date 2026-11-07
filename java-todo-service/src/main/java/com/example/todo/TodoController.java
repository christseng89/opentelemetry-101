package com.example.todo;

import com.example.todo.telemetry.CsTelemetry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

@RestController
@Tag(name = "Todos")
public class TodoController {
    private final TodoService todoService;
    private final CsTelemetry telemetry;

    public TodoController(TodoService todoService, CsTelemetry telemetry) {
        this.todoService = todoService;
        this.telemetry = telemetry;
    }

    @GetMapping("/api/todos")
    @Operation(summary = "Return configured todo items")
    public List<TodoItem> getTodos(HttpServletResponse response) {
        String traceId = telemetry.tracers().currentTraceId();
        if (!traceId.isBlank()) {
            response.setHeader("X-Trace-Id", traceId);
        }
        return todoService.listTodos();
    }
}
